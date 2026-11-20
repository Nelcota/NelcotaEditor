import { groupWordsIntoCues, toCue, wordsInsideRange } from "#/modules/clips/caption-cues";
import type { CaptionCue, CaptionWord, StudioDraft } from "#/modules/clips/clip-studio.schema";
import { MAX_CAPTION_WORDS_PER_CUE } from "#/modules/clips/clip-studio.schema";

const WHITESPACE = /\s+/;

/** Spreads the cue's time evenly over new words when the count changed. */
function spreadWords(texts: Array<string>, cue: CaptionCue): Array<CaptionWord> {
    const stepSeconds = (cue.endSeconds - cue.startSeconds) / texts.length;

    return texts.map((text, index) => ({
        text,
        startSeconds: cue.startSeconds + stepSeconds * index,
        endSeconds: cue.startSeconds + stepSeconds * (index + 1),
    }));
}

/**
 * New text for a cue. Same number of words keeps each word's own timing (fixing a misheard word);
 * otherwise the cue's time is shared out evenly. Empty text removes the cue (null).
 */
export function editCueText(cue: CaptionCue, text: string): CaptionCue | null {
    const texts = text
        .trim()
        .split(WHITESPACE)
        .filter((word) => word.length > 0)
        .slice(0, MAX_CAPTION_WORDS_PER_CUE);

    if (texts.length === 0) {
        return null;
    }

    if (texts.length === cue.words.length) {
        const words = cue.words.map((word, index) => ({
            ...word,
            text: texts[index] ?? word.text,
        }));
        return { ...cue, words };
    }

    return { ...cue, words: spreadWords(texts, cue) };
}

/** Moves a cue's edges and stretches its words to match, so the highlight keeps its rhythm. */
export function retimeCue(cue: CaptionCue, startSeconds: number, endSeconds: number): CaptionCue {
    const oldLength = cue.endSeconds - cue.startSeconds;
    const newLength = endSeconds - startSeconds;

    if (oldLength <= 0) {
        const texts = cue.words.map((word) => word.text);
        const range = { ...cue, startSeconds, endSeconds };

        return { startSeconds, endSeconds, words: spreadWords(texts, range) };
    }

    const scale = newLength / oldLength;
    const move = (seconds: number): number => startSeconds + (seconds - cue.startSeconds) * scale;

    return {
        startSeconds,
        endSeconds,
        words: cue.words.map((word) => ({
            text: word.text,
            startSeconds: move(word.startSeconds),
            endSeconds: move(word.endSeconds),
        })),
    };
}

/** Breaks a cue before the word at wordIndex; null when there is nothing on one side. */
export function splitCue(cue: CaptionCue, wordIndex: number): [CaptionCue, CaptionCue] | null {
    if (wordIndex <= 0 || wordIndex >= cue.words.length) {
        return null;
    }

    const first = toCue(cue.words.slice(0, wordIndex));
    const second = toCue(cue.words.slice(wordIndex));

    if (first === null || second === null) {
        return null;
    }

    return [first, second];
}

/** What Tinta transcribed during this cue's time. */
export function transcriptWordsOf(cue: CaptionCue, words: Array<CaptionWord>): Array<CaptionWord> {
    return wordsInsideRange(words, cue);
}

/** The cue back to Tinta's words for its time; unchanged when Tinta heard nothing there. */
export function resetCue(cue: CaptionCue, words: Array<CaptionWord>): CaptionCue {
    const original = toCue(transcriptWordsOf(cue, words));

    if (original === null) {
        return cue;
    }

    return original;
}

/** Puts zero, one or more cues where the cue at index was. */
export function replaceCueAt(
    draft: StudioDraft,
    index: number,
    replacement: Array<CaptionCue>,
): StudioDraft {
    if (index < 0 || index >= draft.cues.length) {
        return draft;
    }

    const cues = [...draft.cues.slice(0, index), ...replacement, ...draft.cues.slice(index + 1)];

    return { ...draft, cues };
}

/** Every caption of the clip back to the transcript. */
export function resetAllCues(draft: StudioDraft, words: Array<CaptionWord>): StudioDraft {
    return { ...draft, cues: groupWordsIntoCues(wordsInsideRange(words, draft)) };
}

export function cueText(cue: CaptionCue): string {
    return cue.words.map((word) => word.text).join(" ");
}

/** How far a cue's edges can move: up to its neighbours and the clip's edges. */
export function cueLimits(draft: StudioDraft, index: number): { min: number; max: number } {
    const previousCue = draft.cues[index - 1];
    const nextCue = draft.cues[index + 1];
    let min = draft.startSeconds;
    let max = draft.endSeconds;

    if (previousCue !== undefined) {
        min = previousCue.endSeconds;
    }

    if (nextCue !== undefined) {
        max = nextCue.startSeconds;
    }

    return { min, max };
}
