import { groupWordsIntoCues, wordsInsideRange } from "#/modules/clips/model/caption-cues";
import type { CaptionCue, CaptionWord, StudioDraft } from "#/modules/clips/model/clip-studio";

interface TimeRange {
    startSeconds: number;
    endSeconds: number;
}

/**
 * Where a cue starts once the range may cut it. A cut cue starts at its first remaining word, not at
 * the clip start: the dropped word before it comes back as its own cue when the start moves back,
 * and must not overlap this one.
 */
function cutCueStart(cue: CaptionCue, firstWord: CaptionWord, range: TimeRange): number {
    if (cue.startSeconds >= range.startSeconds) {
        return cue.startSeconds;
    }

    return firstWord.startSeconds;
}

/** A cue cut to the range; null when nothing of it is left inside. */
function clipCueToRange(cue: CaptionCue, range: TimeRange): CaptionCue | null {
    const words = wordsInsideRange(cue.words, range);
    const firstWord = words[0];

    if (firstWord === undefined) {
        return null;
    }

    return {
        startSeconds: cutCueStart(cue, firstWord, range),
        endSeconds: Math.min(cue.endSeconds, range.endSeconds),
        words,
    };
}

/** Transcript words that the old range did not hold: they enter as plain, ungrouped captions. */
function newlyIncludedWords(
    words: Array<CaptionWord>,
    oldRange: TimeRange,
    newRange: TimeRange,
): Array<CaptionWord> {
    return wordsInsideRange(words, newRange).filter(
        (word) =>
            word.startSeconds < oldRange.startSeconds || word.startSeconds >= oldRange.endSeconds,
    );
}

/**
 * Moves the clip's edges. Edited captions inside the new range are kept; speech that the clip now
 * reaches comes in from the transcript, so captions always follow what is heard.
 */
export function trimDraft(
    draft: StudioDraft,
    range: TimeRange,
    words: Array<CaptionWord>,
): StudioDraft {
    const keptCues = draft.cues
        .map((cue) => clipCueToRange(cue, range))
        .filter((cue): cue is CaptionCue => cue !== null);
    const addedCues = groupWordsIntoCues(newlyIncludedWords(words, draft, range));
    const cues = [...keptCues, ...addedCues].toSorted(
        (first, second) => first.startSeconds - second.startSeconds,
    );

    return { ...draft, startSeconds: range.startSeconds, endSeconds: range.endSeconds, cues };
}
