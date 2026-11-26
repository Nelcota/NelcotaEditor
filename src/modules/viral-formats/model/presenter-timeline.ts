import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import type { PresenterTake } from "#/modules/viral-formats/model/presenter-plan";

/** A spoken word placed on the edited video's clock. */
export interface CutWord {
    text: string;
    start: number;
    end: number;
}

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
            text: word.text.trim(),
            start: offset + Math.max(word.startSeconds, take.start) - take.start,
            end: offset + Math.min(word.endSeconds, take.end) - take.start,
        }))
        .filter((word) => word.text.length > 0);
}

/** A word belongs to the take that holds its midpoint so it appears once if the cut clips it. */
export function toPresenterWords(
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
