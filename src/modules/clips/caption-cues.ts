import type { CaptionCue, CaptionWord } from "#/modules/clips/clip-studio.schema";

const MAX_WORDS_PER_CUE = 3;
const MAX_GAP_SECONDS = 0.6;
const SENTENCE_END = /[.!?…,;:]$/;

function startsNewCue(cueWords: Array<CaptionWord>, word: CaptionWord): boolean {
    const previousWord = cueWords.at(-1);

    if (previousWord === undefined) {
        return false;
    }

    if (cueWords.length >= MAX_WORDS_PER_CUE) {
        return true;
    }

    if (SENTENCE_END.test(previousWord.text) === true) {
        return true;
    }

    return word.startSeconds - previousWord.endSeconds > MAX_GAP_SECONDS;
}

export function toCue(words: Array<CaptionWord>): CaptionCue | null {
    const firstWord = words[0];
    const lastWord = words.at(-1);

    if (firstWord === undefined || lastWord === undefined) {
        return null;
    }

    return {
        startSeconds: firstWord.startSeconds,
        endSeconds: lastWord.endSeconds,
        words,
    };
}

/** Short groups of words, broken at punctuation and pauses: how captions read best on a phone. */
export function groupWordsIntoCues(words: Array<CaptionWord>): Array<CaptionCue> {
    const cues: Array<CaptionCue> = [];
    let currentWords: Array<CaptionWord> = [];

    for (const word of words) {
        if (startsNewCue(currentWords, word) === true) {
            const cue = toCue(currentWords);

            if (cue !== null) {
                cues.push(cue);
            }

            currentWords = [];
        }

        currentWords.push(word);
    }

    const lastCue = toCue(currentWords);

    if (lastCue !== null) {
        cues.push(lastCue);
    }

    return cues;
}

interface TimeRange {
    startSeconds: number;
    endSeconds: number;
}

/** Words that start inside the range; one that runs past the end is cut at the end. */
export function wordsInsideRange(words: Array<CaptionWord>, range: TimeRange): Array<CaptionWord> {
    return words
        .filter(
            (word) =>
                word.startSeconds >= range.startSeconds && word.startSeconds < range.endSeconds,
        )
        .map((word) => ({
            ...word,
            endSeconds: Math.min(word.endSeconds, range.endSeconds),
        }));
}

/** Moves cue times so 0 is the start of the clip, as the subtitles file expects. */
export function toClipRelativeCues(
    cues: Array<CaptionCue>,
    clipStartSeconds: number,
): Array<CaptionCue> {
    const shift = (seconds: number): number => Math.max(0, seconds - clipStartSeconds);

    return cues.map((cue) => ({
        startSeconds: shift(cue.startSeconds),
        endSeconds: shift(cue.endSeconds),
        words: cue.words.map((word) => ({
            text: word.text,
            startSeconds: shift(word.startSeconds),
            endSeconds: shift(word.endSeconds),
        })),
    }));
}
