import { SENTENCE_END } from "#/modules/transcription/model/build-transcript-lines";
import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";

// About two lines of 42 characters on screen for at most 6 seconds: the usual caption limits.
const MAX_CUE_SECONDS = 6;
const MAX_CUE_CHARACTERS = 84;
const SECONDS_PER_HOUR = 3_600;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1_000;

interface CaptionCue {
    startSeconds: number;
    endSeconds: number;
    text: string;
}

function joinWords(words: Array<TranscriptWord>): string {
    return words.map((word) => word.text.trim()).join(" ");
}

function isCueFull(cueWords: Array<TranscriptWord>, word: TranscriptWord): boolean {
    const firstWord = cueWords[0];

    if (firstWord === undefined) {
        return false;
    }

    if (word.endSeconds - firstWord.startSeconds > MAX_CUE_SECONDS) {
        return true;
    }

    return joinWords([...cueWords, word]).length > MAX_CUE_CHARACTERS;
}

function toCue(cueWords: Array<TranscriptWord>): CaptionCue | null {
    const firstWord = cueWords[0];
    const lastWord = cueWords.at(-1);

    if (firstWord === undefined || lastWord === undefined) {
        return null;
    }

    return {
        startSeconds: firstWord.startSeconds,
        endSeconds: Math.max(...cueWords.map((word) => word.endSeconds)),
        text: joinWords(cueWords),
    };
}

function pushCue(cues: Array<CaptionCue>, cueWords: Array<TranscriptWord>): void {
    const cue = toCue(cueWords);

    if (cue !== null) {
        cues.push(cue);
    }
}

/** Short cues that end at a sentence end, or when they would grow too long to read. */
function groupIntoCues(words: Array<TranscriptWord>): Array<CaptionCue> {
    const cues: Array<CaptionCue> = [];
    let cueWords: Array<TranscriptWord> = [];

    for (const word of words) {
        if (isCueFull(cueWords, word) === true) {
            pushCue(cues, cueWords);
            cueWords = [];
        }

        cueWords.push(word);

        if (SENTENCE_END.test(word.text) === true) {
            pushCue(cues, cueWords);
            cueWords = [];
        }
    }

    pushCue(cues, cueWords);
    return cues;
}

function padNumber(value: number, length: number): string {
    return String(value).padStart(length, "0");
}

function toVttMilliseconds(seconds: number): number {
    const milliseconds = Math.round(seconds * MILLISECONDS_PER_SECOND);

    if (Number.isSafeInteger(milliseconds) === false || seconds < 0) {
        throw new RangeError(`A caption time must be a finite, non-negative number: ${seconds}`);
    }

    return milliseconds;
}

/** WebVTT timestamps are always hh:mm:ss.ttt. */
export function formatVttTimestamp(seconds: number): string {
    return formatVttMilliseconds(toVttMilliseconds(seconds));
}

function formatVttMilliseconds(totalMilliseconds: number): string {
    const totalSeconds = Math.floor(totalMilliseconds / MILLISECONDS_PER_SECOND);
    const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
    const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    const wholeSeconds = totalSeconds % SECONDS_PER_MINUTE;
    const milliseconds = totalMilliseconds % MILLISECONDS_PER_SECOND;

    return `${padNumber(hours, 2)}:${padNumber(minutes, 2)}:${padNumber(wholeSeconds, 2)}.${padNumber(milliseconds, 3)}`;
}

/** `&` and `<` start markup in a cue; the spoken text must never be read as tags. */
function escapeCueText(text: string): string {
    return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function formatCue(cue: CaptionCue): Array<string> {
    const startMilliseconds = toVttMilliseconds(cue.startSeconds);
    const endMilliseconds = toVttMilliseconds(cue.endSeconds);

    if (endMilliseconds <= startMilliseconds) {
        return [];
    }

    const start = formatVttMilliseconds(startMilliseconds);
    const end = formatVttMilliseconds(endMilliseconds);
    return [`${start} --> ${end}\n${escapeCueText(cue.text)}`];
}

/** The transcript as a WebVTT captions file, so players can show it as closed captions. */
export function buildWebVtt(words: Array<TranscriptWord>): string {
    const sortedWords = words.toSorted((first, second) => first.startSeconds - second.startSeconds);
    const blocks = ["WEBVTT", ...groupIntoCues(sortedWords).flatMap(formatCue)];

    return `${blocks.join("\n\n")}\n`;
}
