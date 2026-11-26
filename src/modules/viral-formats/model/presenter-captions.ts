import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { measureCutSeconds } from "#/modules/viral-formats/model/presenter-plan";
import type { PresenterPlan } from "#/modules/viral-formats/model/presenter-plan";
import { toPresenterWords } from "#/modules/viral-formats/model/presenter-timeline";
import type { CutWord } from "#/modules/viral-formats/model/presenter-timeline";

const MAX_CAPTION_WORDS = 4;
const MAX_CAPTION_LENGTH = 32;
const MAX_CAPTION_SECONDS = 1.6;
const MAX_JOIN_GAP_SECONDS = 0.28;
const MIN_CAPTION_SECONDS = 0.24;
const SENTENCE_END = /[.!?…][”"')\]]*$/u;

interface CaptionCue {
    start: number;
    end: number;
    words: Array<string>;
}

function cleanCaptionWord(text: string): string {
    return text
        .replace(/[{}\\]/gu, "")
        .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]+/gu, " ")
        .trim();
}

function canJoinCue(cue: CaptionCue, word: CutWord, text: string): boolean {
    const lastWord = cue.words.at(-1) ?? "";

    return (
        SENTENCE_END.test(lastWord) === false &&
        cue.words.length < MAX_CAPTION_WORDS &&
        cue.words.join(" ").length + 1 + text.length <= MAX_CAPTION_LENGTH &&
        word.start - cue.end <= MAX_JOIN_GAP_SECONDS &&
        word.end - cue.start <= MAX_CAPTION_SECONDS
    );
}

function groupCaptions(words: ReadonlyArray<CutWord>): Array<CaptionCue> {
    const cues: Array<CaptionCue> = [];

    for (const word of words) {
        const text = cleanCaptionWord(word.text);

        if (text.length === 0) {
            continue;
        }

        const cue = cues.at(-1);

        if (cue !== undefined && canJoinCue(cue, word, text) === true) {
            cue.words.push(text);
            cue.end = Math.max(cue.end, word.end);
            continue;
        }

        cues.push({ start: word.start, end: word.end, words: [text] });
    }

    return cues;
}

export function toPresenterCaptions(
    plan: PresenterPlan,
    words: ReadonlyArray<TranscriptWord>,
): Array<CaptionCue> {
    const cues = groupCaptions(toPresenterWords(plan.takes, words));
    const duration = measureCutSeconds(plan.takes);

    return cues.map((cue, index) => {
        const nextStart = cues[index + 1]?.start ?? duration;
        const end = Math.min(nextStart, Math.max(cue.end, cue.start + MIN_CAPTION_SECONDS));
        return { ...cue, end };
    });
}
