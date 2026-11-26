import { FRAME_WIDTH, buildAssOverlay, toAssTime } from "#/modules/viral-formats/model/ass-overlay";
import type { ContrastPlan } from "#/modules/viral-formats/model/contrast-plan";
import { measureCutSeconds } from "#/modules/viral-formats/model/presenter-plan";

const CENTRE_X = FRAME_WIDTH / 2;
const GOOD_X = 270;
const BAD_X = 810;
const TOPIC_Y = 320;
const VERDICT_Y = 1090;
const OPTION_Y = 1420;
// ASS stores colours as alpha, blue, green, red.
const INK = "&H00171717";
const WHITE = "&H00FFFFFF";
const YELLOW = "&H0000E5FF";
const GREEN = "&H00437A14";
const RED = "&H00322BA8";
const GRAPHITE = "&H00333333";
const TOPIC_SIZE = 40;
const VERDICT_SIZE = 60;
const BOX_PADDING = 14;

const VERDICT_STYLES = {
    good: { good: "Good", bad: "Inactive", label: "BOM" },
    bad: { good: "Inactive", bad: "Bad", label: "RUIM" },
};

function boxStyle(name: string, fontSize: number, colours: { text: string; box: string }): string {
    const { text, box } = colours;
    return `Style: ${name},Inter,${fontSize},${text},${text},${box},${box},-1,0,0,0,100,100,0,0,3,${BOX_PADDING},0,5,60,60,0,1`;
}

const STYLES = [
    boxStyle("Topic", TOPIC_SIZE, { text: INK, box: YELLOW }),
    boxStyle("Good", VERDICT_SIZE, { text: WHITE, box: GREEN }),
    boxStyle("Bad", VERDICT_SIZE, { text: WHITE, box: RED }),
    boxStyle("Inactive", VERDICT_SIZE, { text: WHITE, box: GRAPHITE }),
    boxStyle("Option", TOPIC_SIZE, { text: INK, box: WHITE }),
];

function dialogue(
    interval: { start: number; end: number },
    position: { x: number; y: number },
    overlay: { style: string; text: string },
): string {
    const { x, y } = position;
    const { style, text } = overlay;
    return `Dialogue: 0,${toAssTime(interval.start)},${toAssTime(interval.end)},${style},,0,0,0,,{\\q0\\an5\\pos(${x},${y})}${text}`;
}

function comparisonEvents(comparison: ContrastPlan["comparisons"][number]): Array<string> {
    const styles = VERDICT_STYLES[comparison.verdict];
    return [
        dialogue(comparison, { x: GOOD_X, y: VERDICT_Y }, { style: styles.good, text: "BOM" }),
        dialogue(comparison, { x: BAD_X, y: VERDICT_Y }, { style: styles.bad, text: "RUIM" }),
        dialogue(
            comparison,
            { x: CENTRE_X, y: OPTION_Y },
            { style: "Option", text: `${styles.label} · ${comparison.label}` },
        ),
    ];
}

export function buildContrastOverlay(plan: ContrastPlan): string {
    const duration = measureCutSeconds(plan.takes);
    const heading = dialogue(
        { start: 0, end: duration },
        { x: CENTRE_X, y: TOPIC_Y },
        { style: "Topic", text: plan.topic },
    );
    return buildAssOverlay(STYLES, [heading, ...plan.comparisons.flatMap(comparisonEvents)]);
}
