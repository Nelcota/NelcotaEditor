import type { CaptionCue, CaptionWord } from "#/modules/clips/model/clip-studio";

const MAX_WORDS_PER_CUE = 3;
const MAX_GAP_HUNDREDTHS = 60;
const HUNDREDTHS_PER_SECOND = 100;
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

    // Compared in hundredths: in floats 2.6 - 2.0 is 0.6000000000000001 and broke a 0.60 s pause.
    const gapHundredths = Math.round(
        (word.startSeconds - previousWord.endSeconds) * HUNDREDTHS_PER_SECOND,
    );

    return gapHundredths > MAX_GAP_HUNDREDTHS;
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

/** Adds the words as one cue to the list being built; an empty group adds nothing. */
function pushCue(cues: Array<CaptionCue>, words: Array<CaptionWord>): void {
    const cue = toCue(words);

    if (cue !== null) {
        cues.push(cue);
    }
}

/** Short groups of words, broken at punctuation and pauses: how captions read best on a phone. */
export function groupWordsIntoCues(words: Array<CaptionWord>): Array<CaptionCue> {
    const cues: Array<CaptionCue> = [];
    let currentWords: Array<CaptionWord> = [];

    for (const word of words) {
        if (startsNewCue(currentWords, word) === true) {
            pushCue(cues, currentWords);
            currentWords = [];
        }

        currentWords.push(word);
    }

    pushCue(cues, currentWords);

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
