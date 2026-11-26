import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { measureCutSeconds } from "#/modules/viral-formats/model/presenter-plan";
import type { PresenterTake } from "#/modules/viral-formats/model/presenter-plan";
import { toPresenterWords } from "#/modules/viral-formats/model/presenter-timeline";
import type { CutWord } from "#/modules/viral-formats/model/presenter-timeline";
import type { SplitScreenPanel } from "#/modules/viral-formats/model/split-screen-plan";

/** One stretch of the edited video with the same top panel, in seconds of the edited video. */
export type SplitScreenPiece = SplitScreenPanel & { start: number; end: number };

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

export function toCutWords(
    takes: ReadonlyArray<PresenterTake>,
    words: ReadonlyArray<TranscriptWord>,
): Array<CutWord> {
    return toPresenterWords(takes, words)
        .map((word) => ({ ...word, text: toCaptionText(word.text) }))
        .filter((word) => word.text.length > 0);
}
