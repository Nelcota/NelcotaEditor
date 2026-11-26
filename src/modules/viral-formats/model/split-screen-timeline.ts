import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { measureCutSeconds } from "#/modules/viral-formats/model/presenter-plan";
import type { PresenterTake } from "#/modules/viral-formats/model/presenter-plan";
import type { SplitScreenPanel } from "#/modules/viral-formats/model/split-screen-plan";

/** One stretch of the edited video with the same top panel, in seconds of the edited video. */
export type SplitScreenPiece = SplitScreenPanel & { start: number; end: number };

/** A spoken word placed on the edited video's clock, ready to be one caption. */
export interface CutWord {
    text: string;
    start: number;
    end: number;
}

// Captions are lower case with no punctuation, as the format's reference shows them.
const PUNCTUATION = /[\p{P}\p{S}]/gu;

/** Each panel runs until the next one starts; the last one until the video ends. */
export function toPanelPieces(
    panels: ReadonlyArray<SplitScreenPanel>,
    takes: ReadonlyArray<PresenterTake>,
): Array<SplitScreenPiece> {
    const cutSeconds = measureCutSeconds(takes);

    return panels.map((panel, index) => ({
        ...panel,
        start: panel.at,
        end: panels[index + 1]?.at ?? cutSeconds,
    }));
}

function toCaptionText(text: string): string {
    return text.replace(PUNCTUATION, "").trim().toLocaleLowerCase("pt-BR");
}

/** One take's words, each moved by `offset`, the edited time where the take starts. */
function toTakeWords(
    take: PresenterTake,
    offset: number,
    words: ReadonlyArray<TranscriptWord>,
): Array<CutWord> {
    return words
        .filter((word) => {
            const midpoint = (word.startSeconds + word.endSeconds) / 2;
            return midpoint >= take.start && midpoint < take.end;
        })
        .map((word) => ({
            text: toCaptionText(word.text),
            start: offset + Math.max(word.startSeconds, take.start) - take.start,
            end: offset + Math.min(word.endSeconds, take.end) - take.start,
        }))
        .filter((word) => word.text.length > 0);
}

/**
 * The raw transcript's words that fall inside the kept takes, moved onto the edited video's clock.
 * A word belongs to the take that holds its midpoint, so a word cut in half is shown once.
 */
export function toCutWords(
    takes: ReadonlyArray<PresenterTake>,
    words: ReadonlyArray<TranscriptWord>,
): Array<CutWord> {
    const cutWords: Array<CutWord> = [];
    let offset = 0;

    for (const take of takes) {
        cutWords.push(...toTakeWords(take, offset, words));
        offset += take.end - take.start;
    }

    return cutWords;
}
