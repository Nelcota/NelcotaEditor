import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { FRAME_WIDTH, buildAssOverlay, toAssTime } from "#/modules/viral-formats/model/ass-overlay";
import type { GamifiedHighlight, GamifiedPlan } from "#/modules/viral-formats/model/gamified-plan";
import { measureCutSeconds } from "#/modules/viral-formats/model/presenter-plan";
import { toPresenterWords } from "#/modules/viral-formats/model/presenter-timeline";
import type { CutWord } from "#/modules/viral-formats/model/presenter-timeline";

const CENTRE_X = FRAME_WIDTH / 2;
const BADGE_Y = 360;
const CAPTION_Y = 1380;
const MAX_CAPTION_WORDS = 4;
const MAX_CAPTION_LENGTH = 32;
const MAX_CAPTION_SECONDS = 1.6;
const MAX_JOIN_GAP_SECONDS = 0.28;
const MIN_CAPTION_SECONDS = 0.24;
const SENTENCE_END = /[.!?…][”"')\]]*$/u;
const CAPTION_ACCENT = "{\\c&H00E5FF&}";
const CAPTION_WHITE = "{\\c&HFFFFFF&}";
const BADGES = {
    step: { icon: "→", style: "Step" },
    tip: { icon: "+", style: "Tip" },
    emphasis: { icon: "✓", style: "Emphasis" },
};

const STYLES = [
    "Style: Caption,Inter,62,&H00FFFFFF,&H00FFFFFF,&H00171717,&H00171717,-1,0,0,0,100,100,0,0,1,5,0,5,90,90,0,1",
    "Style: Step,Inter,51,&H00171717,&H00171717,&H0000E5FF,&H0000E5FF,-1,0,0,0,100,100,0,0,3,17,0,5,86,86,0,1",
    "Style: Tip,Inter,51,&H00171717,&H00171717,&H0084EEC1,&H0084EEC1,-1,0,0,0,100,100,0,0,3,17,0,5,86,86,0,1",
    "Style: Emphasis,Inter,51,&H00171717,&H00171717,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,3,17,0,5,86,86,0,1",
];

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

function keywordKey(text: string): string {
    return text
        .normalize("NFC")
        .toLocaleLowerCase("pt-BR")
        .replace(/[^\p{L}\p{M}\p{N}]/gu, "");
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

function emphasiseKeyword(word: string, keywords: ReadonlySet<string>): string {
    if (keywords.has(keywordKey(word)) === true) {
        return `${CAPTION_ACCENT}${word}${CAPTION_WHITE}`;
    }

    return word;
}

function buildCaptions(plan: GamifiedPlan, words: ReadonlyArray<TranscriptWord>): Array<string> {
    const keywords = new Set(plan.keywords.map(keywordKey));
    const cues = groupCaptions(toPresenterWords(plan.takes, words));
    const duration = measureCutSeconds(plan.takes);

    return cues.map((cue, index) => {
        const nextStart = cues[index + 1]?.start ?? duration;
        const end = Math.min(nextStart, Math.max(cue.end, cue.start + MIN_CAPTION_SECONDS));
        const text = cue.words.map((word) => emphasiseKeyword(word, keywords)).join(" ");
        return `Dialogue: 0,${toAssTime(cue.start)},${toAssTime(end)},Caption,,0,0,0,,{\\q0\\pos(${CENTRE_X},${CAPTION_Y})}${text}`;
    });
}

function buildBadge(highlight: GamifiedHighlight): string {
    const { icon, style } = BADGES[highlight.kind];
    const timing = `${toAssTime(highlight.start)},${toAssTime(highlight.end)}`;
    const tags = `{\\q0\\pos(${CENTRE_X},${BADGE_Y})\\fscx88\\fscy88\\t(0,140,\\fscx100\\fscy100)}`;
    return `Dialogue: 1,${timing},${style},,0,0,0,,${tags}${icon}  ${highlight.label}`;
}

export function buildGamifiedOverlay(
    plan: GamifiedPlan,
    words: ReadonlyArray<TranscriptWord>,
): string {
    return buildAssOverlay(STYLES, [
        ...buildCaptions(plan, words),
        ...plan.highlights.map(buildBadge),
    ]);
}
