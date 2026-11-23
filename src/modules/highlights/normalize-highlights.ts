import { truncateText } from "#/modules/video-records/video-title";
import {
    MAX_CLIP_SECONDS,
    MAX_SCORE,
    MIN_CLIP_SECONDS,
    MIN_SCORE,
} from "#/modules/clips/clip-limits";
import { CLIP_LENGTH_TARGETS } from "#/modules/clips/clip-length-targets";
import { fitClipLength } from "#/modules/highlights/fit-clip-length";
import type { TimeRange } from "#/modules/highlights/fit-clip-length";
import type { TranscriptWord } from "#/modules/transcription/transcript-word";
import type { ClipLength } from "#/modules/video-records/clip-length";

const START_PADDING_SECONDS = 0.15;
const END_PADDING_SECONDS = 0.35;
const OVERLAP_TOLERANCE_SECONDS = 1;
const MAX_TITLE_LENGTH = 100;
const MAX_REASON_LENGTH = 300;

export interface HighlightCandidate {
    startSeconds: number;
    endSeconds: number;
    title: string;
    reason: string;
    score: number;
}

interface NormalizeOptions {
    words: Array<TranscriptWord>;
    durationSeconds: number;
    maxCount: number;
    clipLength: ClipLength;
}

/** Moves the cut points to word boundaries so no word is chopped in half. */
function snapToWords(range: TimeRange, words: Array<TranscriptWord>): TimeRange | null {
    // A word belongs to the clip when most of it is inside, so the previous sentence never leaks in.
    const insideWords = words.filter((word) => {
        const middleSeconds = (word.startSeconds + word.endSeconds) / 2;
        return middleSeconds >= range.startSeconds && middleSeconds <= range.endSeconds;
    });
    const firstWord = insideWords[0];
    const lastWord = insideWords[insideWords.length - 1];

    if (firstWord === undefined || lastWord === undefined) {
        return null;
    }

    return { startSeconds: firstWord.startSeconds, endSeconds: lastWord.endSeconds };
}

interface EndPaddingLimits {
    durationSeconds: number;
    maxLengthSeconds: number;
}

/** Pads the end a little so the last word is not clipped, without leaving the video. */
function padEnd(range: TimeRange, limits: EndPaddingLimits): TimeRange {
    const startSeconds = range.startSeconds;
    const paddedEndSeconds = range.endSeconds + END_PADDING_SECONDS;
    // The padding must not push a clip that is already at its length limit past it.
    const endSeconds = Math.min(
        limits.durationSeconds,
        paddedEndSeconds,
        startSeconds + limits.maxLengthSeconds,
    );

    return { startSeconds, endSeconds };
}

/**
 * How far a clip may grow: up to the next accepted clip, and never past the video. A clip that
 * starts after this one counts even when its padded start sits just before this clip's end.
 */
function findEndLimit(
    range: TimeRange,
    durationSeconds: number,
    accepted: Array<TimeRange>,
): number {
    const laterStarts = accepted
        .map((other) => other.startSeconds)
        .filter((startSeconds) => startSeconds > range.startSeconds);

    return Math.min(durationSeconds, ...laterStarts);
}

function fitRange(
    candidate: HighlightCandidate,
    options: NormalizeOptions,
    accepted: Array<TimeRange>,
): TimeRange | null {
    const durationSeconds = options.durationSeconds;
    const target = CLIP_LENGTH_TARGETS[options.clipLength];
    const startSeconds = Math.max(0, candidate.startSeconds);
    const maxEnd = Math.min(candidate.endSeconds, startSeconds + MAX_CLIP_SECONDS);
    const snapped = snapToWords({ startSeconds, endSeconds: maxEnd }, options.words);

    if (snapped === null) {
        return null;
    }

    // The start is padded before the length is fitted, so trimming already counts the padding
    // and the length limit never has to cut into the last word.
    const paddedStart = Math.max(0, snapped.startSeconds - START_PADDING_SECONDS);
    const startPadded = { startSeconds: paddedStart, endSeconds: snapped.endSeconds };
    const fitted = fitClipLength({
        range: startPadded,
        words: options.words,
        target,
        endLimitSeconds: findEndLimit(startPadded, durationSeconds, accepted),
    });
    const padded = padEnd(fitted, { durationSeconds, maxLengthSeconds: target.trimAboveSeconds });

    if (padded.endSeconds - padded.startSeconds < MIN_CLIP_SECONDS) {
        return null;
    }

    return padded;
}

/** Back-to-back clips touch because of the padding; only a real overlap rules a clip out. */
function overlapsAny(range: TimeRange, accepted: Array<TimeRange>): boolean {
    return accepted.some(
        (other) =>
            range.startSeconds < other.endSeconds - OVERLAP_TOLERANCE_SECONDS &&
            other.startSeconds < range.endSeconds - OVERLAP_TOLERANCE_SECONDS,
    );
}

// The app's copy never uses em or en dashes; the prompt asks for none, and this enforces it.
const DASH_SEPARATOR = /\s*[\u2013\u2014]\s*/g;

function replaceDashes(text: string): string {
    return text.replace(DASH_SEPARATOR, ", ").trim();
}

function cleanCandidate(candidate: HighlightCandidate, range: TimeRange): HighlightCandidate {
    const roundedScore = Math.round(candidate.score);

    return {
        ...range,
        title: truncateText(replaceDashes(candidate.title), MAX_TITLE_LENGTH),
        reason: truncateText(replaceDashes(candidate.reason), MAX_REASON_LENGTH),
        score: Math.min(MAX_SCORE, Math.max(MIN_SCORE, roundedScore)),
    };
}

function assertValidOptions(options: NormalizeOptions): void {
    const { durationSeconds, maxCount } = options;

    // A NaN duration would turn every clamped end into NaN and let broken clips through.
    if (Number.isFinite(durationSeconds) === false || durationSeconds <= 0) {
        throw new RangeError(`Video duration must be a positive number, got ${durationSeconds}`);
    }

    if (Number.isInteger(maxCount) === false || maxCount < 1) {
        throw new RangeError(`Highlight count must be a positive integer, got ${maxCount}`);
    }
}

/**
 * The language model output is untrusted: clamp it to the video, snap to words,
 * drop overlaps and keep the best ones, returned in chronological order.
 */
export function normalizeHighlights(
    candidates: Array<HighlightCandidate>,
    options: NormalizeOptions,
): Array<HighlightCandidate> {
    const maxCount = options.maxCount;

    assertValidOptions(options);
    const byScore = candidates.toSorted((first, second) => second.score - first.score);
    const accepted: Array<HighlightCandidate> = [];

    for (const candidate of byScore) {
        const range = fitRange(candidate, options, accepted);

        if (range === null || overlapsAny(range, accepted) === true) {
            continue;
        }

        accepted.push(cleanCandidate(candidate, range));

        if (accepted.length >= maxCount) {
            break;
        }
    }

    return accepted.toSorted((first, second) => first.startSeconds - second.startSeconds);
}
