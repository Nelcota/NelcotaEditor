import { truncateText } from "#/modules/video-records/video-title";
import {
    MAX_CLIP_SECONDS,
    MAX_SCORE,
    MIN_CLIP_SECONDS,
    MIN_SCORE,
} from "#/modules/clips/clip-limits";
import type { TranscriptWord } from "#/modules/transcription/transcript-word";

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
}

interface TimeRange {
    startSeconds: number;
    endSeconds: number;
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

/** Pads the cut a little so the first and last words are not clipped, without leaving the video. */
function padRange(snapped: TimeRange, durationSeconds: number): TimeRange {
    const startSeconds = Math.max(0, snapped.startSeconds - START_PADDING_SECONDS);
    const paddedEndSeconds = snapped.endSeconds + END_PADDING_SECONDS;
    // The padding must not push a clip that is already at the limit past MAX_CLIP_SECONDS.
    const endSeconds = Math.min(durationSeconds, paddedEndSeconds, startSeconds + MAX_CLIP_SECONDS);

    return { startSeconds, endSeconds };
}

function fitRange(candidate: HighlightCandidate, options: NormalizeOptions): TimeRange | null {
    const startSeconds = Math.max(0, candidate.startSeconds);
    const maxEnd = Math.min(candidate.endSeconds, startSeconds + MAX_CLIP_SECONDS);
    const snapped = snapToWords({ startSeconds, endSeconds: maxEnd }, options.words);

    if (snapped === null) {
        return null;
    }

    const padded = padRange(snapped, options.durationSeconds);

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
        const range = fitRange(candidate, options);

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
