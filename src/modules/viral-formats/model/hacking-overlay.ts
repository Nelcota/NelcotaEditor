import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { FRAME_WIDTH, buildAssOverlay, toAssTime } from "#/modules/viral-formats/model/ass-overlay";
import type { HackingItem, HackingPlan } from "#/modules/viral-formats/model/hacking-plan";
import { toPresenterCaptions } from "#/modules/viral-formats/model/presenter-captions";
import { measureCutSeconds } from "#/modules/viral-formats/model/presenter-plan";

const CENTRE_X = FRAME_WIDTH / 2;
const BOARD_WIDTH = 840;
const MAX_COLUMN_SPACING = 176;
const SPOTLIGHT_SECONDS = 1.25;
const MARKER_LENGTH = 3;
const Y = { Number: 270, Marker: 394, Caption: 1190, Spotlight: 1320, Topic: 1460 } as const;
const STYLES = [
    "Style: Number,Inter,50,&H00171717,&H00171717,&H0000E5FF,&H0000E5FF,-1,0,0,0,100,100,0,0,3,12,0,5,0,0,0,1",
    "Style: Marker,Inter,34,&H00171717,&H00171717,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,3,10,0,5,0,0,0,1",
    "Style: Caption,Inter,57,&H00FFFFFF,&H00FFFFFF,&H00171717,&H00171717,-1,0,0,0,100,100,0,0,1,5,0,5,90,90,0,1",
    "Style: Spotlight,Inter,47,&H00171717,&H00171717,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,3,16,0,5,90,90,0,1",
    "Style: Topic,Inter,53,&H00171717,&H00171717,&H0000E5FF,&H0000E5FF,-1,0,0,0,100,100,0,0,3,17,0,5,100,100,0,1",
];

function dialogue(
    interval: { start: number; end: number },
    element: { style: keyof typeof Y; text: string; x?: number },
): string {
    const { style, text, x = CENTRE_X } = element;
    return `Dialogue: 0,${toAssTime(interval.start)},${toAssTime(interval.end)},${style},,0,0,0,,{\\q0\\pos(${x},${Y[style]})}${text}`;
}

function toColumnX(position: number, count: number): number {
    const spacing = Math.min(MAX_COLUMN_SPACING, BOARD_WIDTH / (count - 1));
    return Math.round(CENTRE_X + (position - (count + 1) / 2) * spacing);
}

function toMarker(item: HackingItem): string {
    const { label, marker, position } = item;
    const labelWords = label.match(/[\p{L}\p{N}]+/gu) ?? [];
    let initials = labelWords.map((word) => Array.from(word)[0]).join("");

    if (labelWords.length === 1) {
        initials = labelWords[0] ?? "";
    }

    const text = marker ?? initials;

    if (text.length === 0) {
        return String(position);
    }

    return Array.from(text.toLocaleUpperCase("pt-BR")).slice(0, MARKER_LENGTH).join("");
}

function buildBoard(plan: HackingPlan): Array<string> {
    const duration = measureCutSeconds(plan.takes);
    const end = Math.min(plan.outroAt ?? duration, duration);
    const { items, topic } = plan;
    const count = items.length;
    const wholeBoard = { start: 0, end };
    const numbers = items.map(({ position }) =>
        dialogue(wholeBoard, {
            style: "Number",
            text: String(position),
            x: toColumnX(position, count),
        }),
    );
    const recalls = items.flatMap((item, index) => {
        const { at, position, label } = item;
        const spotlightEnd = Math.min(end, items[index + 1]?.at ?? end, at + SPOTLIGHT_SECONDS);
        return [
            dialogue(
                { start: at, end },
                { style: "Marker", text: toMarker(item), x: toColumnX(position, count) },
            ),
            dialogue(
                { start: at, end: spotlightEnd },
                { style: "Spotlight", text: `${position} · ${label}` },
            ),
        ];
    });

    return [...numbers, ...recalls, dialogue(wholeBoard, { style: "Topic", text: topic })];
}

export function buildHackingOverlay(
    plan: HackingPlan,
    words: ReadonlyArray<TranscriptWord>,
): string {
    const captions = toPresenterCaptions(plan, words).map((cue) =>
        dialogue(cue, { style: "Caption", text: cue.words.join(" ") }),
    );
    return buildAssOverlay(STYLES, [...buildBoard(plan), ...captions]);
}
