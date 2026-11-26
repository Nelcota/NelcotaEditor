import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { FRAME_WIDTH, buildAssOverlay, toAssTime } from "#/modules/viral-formats/model/ass-overlay";
import type { GamifiedHighlight, GamifiedPlan } from "#/modules/viral-formats/model/gamified-plan";
import { toPresenterCaptions } from "#/modules/viral-formats/model/presenter-captions";

const CENTRE_X = FRAME_WIDTH / 2;
const BADGE_Y = 360;
const CAPTION_Y = 1380;
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

function keywordKey(text: string): string {
    return text
        .normalize("NFC")
        .toLocaleLowerCase("pt-BR")
        .replace(/[^\p{L}\p{M}\p{N}]/gu, "");
}

function emphasiseKeyword(word: string, keywords: ReadonlySet<string>): string {
    if (keywords.has(keywordKey(word)) === true) {
        return `${CAPTION_ACCENT}${word}${CAPTION_WHITE}`;
    }

    return word;
}

function buildCaptions(plan: GamifiedPlan, words: ReadonlyArray<TranscriptWord>): Array<string> {
    const keywords = new Set(plan.keywords.map(keywordKey));
    const cues = toPresenterCaptions(plan, words);

    return cues.map((cue) => {
        const text = cue.words.map((word) => emphasiseKeyword(word, keywords)).join(" ");
        return `Dialogue: 0,${toAssTime(cue.start)},${toAssTime(cue.end)},Caption,,0,0,0,,{\\q0\\pos(${CENTRE_X},${CAPTION_Y})}${text}`;
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
