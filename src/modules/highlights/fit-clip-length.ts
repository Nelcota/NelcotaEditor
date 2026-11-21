import type { ClipLengthTarget } from "#/modules/clips/clip-length-targets";
import { SENTENCE_END } from "#/modules/transcription/build-transcript-lines";
import type { TranscriptWord } from "#/modules/transcription/transcript-word";

export interface TimeRange {
    startSeconds: number;
    endSeconds: number;
}

interface ClipLengthFit {
    /** Already snapped to word boundaries. */
    range: TimeRange;
    words: Array<TranscriptWord>;
    target: ClipLengthTarget;
    /** The latest end an extension may reach: the next accepted clip or the end of the video. */
    endLimitSeconds: number;
}

/** Ends the clip at the last word that finishes within `lengthSeconds` of its start. */
function trimToLength(fit: ClipLengthFit, lengthSeconds: number): TimeRange {
    const range = fit.range;
    const latestEnd = range.startSeconds + lengthSeconds;
    const fittingWords = fit.words.filter(
        (word) => word.startSeconds >= range.startSeconds && word.endSeconds <= latestEnd,
    );
    const lastWord = fittingWords[fittingWords.length - 1];

    if (lastWord === undefined) {
        return range;
    }

    return { startSeconds: range.startSeconds, endSeconds: lastWord.endSeconds };
}

function closestTo(words: Array<TranscriptWord>, endSeconds: number): TranscriptWord | undefined {
    const byDistance = words.toSorted(
        (first, second) =>
            Math.abs(first.endSeconds - endSeconds) - Math.abs(second.endSeconds - endSeconds),
    );

    return byDistance[0];
}

/** A sentence end inside the target range reads best; any later word boundary otherwise. */
function pickEndWord(
    fit: ClipLengthFit,
    laterWords: Array<TranscriptWord>,
    aimSeconds: number,
): TranscriptWord | undefined {
    const startSeconds = fit.range.startSeconds;
    const sentenceEnds = laterWords.filter(
        (word) =>
            SENTENCE_END.test(word.text) === true &&
            word.endSeconds - startSeconds >= fit.target.minSeconds,
    );

    if (sentenceEnds.length > 0) {
        return closestTo(sentenceEnds, startSeconds + aimSeconds);
    }

    return closestTo(laterWords, startSeconds + aimSeconds);
}

/** Moves the end to a later word boundary near the aimed length, when the transcript has one. */
function extendTowardAim(fit: ClipLengthFit, aimSeconds: number): TimeRange {
    const range = fit.range;
    const latestEnd = Math.min(range.startSeconds + fit.target.maxSeconds, fit.endLimitSeconds);
    const laterWords = fit.words.filter(
        (word) => word.endSeconds > range.endSeconds && word.endSeconds <= latestEnd,
    );
    const endWord = pickEndWord(fit, laterWords, aimSeconds);

    if (endWord === undefined) {
        return range;
    }

    return { startSeconds: range.startSeconds, endSeconds: endWord.endSeconds };
}

/** Brings a chosen clip close to the length the person asked for, cutting only between words. */
export function fitClipLength(fit: ClipLengthFit): TimeRange {
    const range = fit.range;
    const target = fit.target;
    const aimSeconds = target.aimSeconds;
    const lengthSeconds = range.endSeconds - range.startSeconds;

    if (lengthSeconds > target.trimAboveSeconds) {
        return trimToLength(fit, target.trimAboveSeconds);
    }

    if (aimSeconds !== null && lengthSeconds < target.minSeconds) {
        return extendTowardAim(fit, aimSeconds);
    }

    return range;
}
