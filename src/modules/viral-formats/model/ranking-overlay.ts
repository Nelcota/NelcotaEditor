import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { FRAME_WIDTH, buildAssOverlay, toAssTime } from "#/modules/viral-formats/model/ass-overlay";
import { toPresenterCaptions } from "#/modules/viral-formats/model/presenter-captions";
import { measureCutSeconds } from "#/modules/viral-formats/model/presenter-plan";
import type { RankedItem } from "#/modules/viral-formats/model/ranked-presenter-plan";
import type { RankingPlan } from "#/modules/viral-formats/model/ranking-plan";

const BOARD_LEFT = 100;
const BOARD_BOTTOM = 1690;
const ROW_WIDTH = FRAME_WIDTH - 2 * BOARD_LEFT;
const ROW_HEIGHT = 56;
const ROW_STEP = 64;
const NUMBER_X = BOARD_LEFT + 40;
const LABEL_X = BOARD_LEFT + 82;
const ACTIVE_MARK_X = FRAME_WIDTH - BOARD_LEFT - 34;
const TOPIC_OFFSET = 65;
const CAPTION_OFFSET = 190;
const OUTRO_CAPTION_Y = 1390;
const MAX_UNSCALED_LABEL_LENGTH = 18;
const FULL_SCALE = 100;

// Inline ASS colours use BGR order. The current row uses the same lime as the gallery cover.
const ROW_COLOURS = {
    pending: { background: "383838", text: "D4D4D4" },
    revealed: { background: "222222", text: "FFFFFF" },
    active: { background: "00F8C4", text: "171717" },
};

const STYLES = [
    "Style: Board,Inter,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1",
    "Style: Row,Inter,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,4,0,0,0,1",
    "Style: Topic,Inter,48,&H00FFFFFF,&H00FFFFFF,&H00171717,&H00171717,-1,0,0,0,100,100,0,0,1,4,0,5,100,100,0,1",
    "Style: Caption,Inter,57,&H00FFFFFF,&H00FFFFFF,&H00171717,&H00171717,-1,0,0,0,100,100,0,0,1,5,0,5,90,90,0,1",
];

interface Interval {
    start: number;
    end: number;
}

function drawRow(
    interval: Interval,
    item: RankedItem,
    row: { y: number; state: keyof typeof ROW_COLOURS },
): Array<string> {
    const { y, state } = row;
    const start = toAssTime(interval.start);
    const end = toAssTime(interval.end);

    if (end === start) {
        return [];
    }

    const timing = `${start},${end}`;
    const colours = ROW_COLOURS[state];
    const centreY = y + ROW_HEIGHT / 2;
    let label = item.label;

    if (state === "pending") {
        label = "…";
    }

    const scale = Math.min(
        FULL_SCALE,
        Math.floor((FULL_SCALE * MAX_UNSCALED_LABEL_LENGTH) / label.length),
    );

    const events = [
        `Dialogue: 0,${timing},Board,,0,0,0,,{\\an7\\pos(${BOARD_LEFT},${y})\\c&H${colours.background}&\\p1}m 0 0 l ${ROW_WIDTH} 0 ${ROW_WIDTH} ${ROW_HEIGHT} 0 ${ROW_HEIGHT}{\\p0}`,
        `Dialogue: 1,${timing},Row,,0,0,0,,{\\an5\\pos(${NUMBER_X},${centreY})\\c&H${colours.text}&}${item.position}`,
        `Dialogue: 1,${timing},Row,,0,0,0,,{\\q2\\pos(${LABEL_X},${centreY})\\c&H${colours.text}&\\fscx${scale}}${label}`,
    ];

    if (state === "active") {
        events.push(
            `Dialogue: 1,${timing},Row,,0,0,0,,{\\an5\\pos(${ACTIVE_MARK_X},${centreY})\\c&H${colours.text}&}▶`,
        );
    }

    return events;
}

function buildRows(items: ReadonlyArray<RankedItem>, top: number, end: number): Array<string> {
    return items.flatMap((item, index) => {
        const y = top + (item.position - 1) * ROW_STEP;
        const nextReveal = items[index + 1]?.at ?? end;
        return [
            ...drawRow({ start: 0, end: item.at }, item, { y, state: "pending" }),
            ...drawRow({ start: item.at, end: nextReveal }, item, { y, state: "active" }),
            ...drawRow({ start: nextReveal, end }, item, { y, state: "revealed" }),
        ];
    });
}

export function buildRankingOverlay(
    plan: RankingPlan,
    words: ReadonlyArray<TranscriptWord>,
): string {
    const { items, outroAt, takes, topic } = plan;
    const duration = measureCutSeconds(takes);
    const end = Math.min(outroAt ?? duration, duration);
    const top = BOARD_BOTTOM - ROW_STEP * items.length;
    const rows = buildRows(items, top, end);
    const heading = `Dialogue: 2,0:00:00.00,${toAssTime(end)},Topic,,0,0,0,,{\\q0\\pos(${FRAME_WIDTH / 2},${top - TOPIC_OFFSET})}${topic}`;
    const captions = toPresenterCaptions(plan, words).map((cue) => {
        let y = top - CAPTION_OFFSET;

        if (cue.start >= end) {
            y = OUTRO_CAPTION_Y;
        }

        return `Dialogue: 2,${toAssTime(cue.start)},${toAssTime(cue.end)},Caption,,0,0,0,,{\\q0\\pos(${FRAME_WIDTH / 2},${y})}${cue.words.join(" ")}`;
    });

    return buildAssOverlay(STYLES, [...rows, heading, ...captions]);
}
