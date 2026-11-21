import type { TranscriptWord } from "#/modules/transcription/transcript-word";

const MAX_LINE_SECONDS = 12;
const SENTENCE_END = /[.!?…]$/;

export interface TranscriptLine {
    startSeconds: number;
    endSeconds: number;
    text: string;
}

function shouldCloseLine(lineWords: Array<TranscriptWord>, word: TranscriptWord): boolean {
    const firstWord = lineWords[0];

    if (firstWord === undefined) {
        return false;
    }

    if (SENTENCE_END.test(word.text) === true) {
        return true;
    }

    return word.endSeconds - firstWord.startSeconds >= MAX_LINE_SECONDS;
}

function toLine(lineWords: Array<TranscriptWord>): TranscriptLine | null {
    const firstWord = lineWords[0];
    const lastWord = lineWords[lineWords.length - 1];

    if (firstWord === undefined || lastWord === undefined) {
        return null;
    }

    return {
        startSeconds: firstWord.startSeconds,
        endSeconds: lastWord.endSeconds,
        text: lineWords.map((word) => word.text).join(" "),
    };
}

function appendLine(lines: Array<TranscriptLine>, lineWords: Array<TranscriptWord>): void {
    const line = toLine(lineWords);

    if (line === null) {
        return;
    }

    lines.push(line);
}

/** Groups words into sentence-like lines so the language model can reason about timestamps. */
export function buildTranscriptLines(words: Array<TranscriptWord>): Array<TranscriptLine> {
    const lines: Array<TranscriptLine> = [];
    let lineWords: Array<TranscriptWord> = [];

    for (const word of words) {
        lineWords.push(word);

        if (shouldCloseLine(lineWords, word) === true) {
            appendLine(lines, lineWords);
            lineWords = [];
        }
    }

    appendLine(lines, lineWords);
    return lines;
}

export function formatTranscriptLines(lines: Array<TranscriptLine>): string {
    return lines
        .map(
            (line) =>
                `[${line.startSeconds.toFixed(2)}-${line.endSeconds.toFixed(2)}] ${line.text}`,
        )
        .join("\n");
}
