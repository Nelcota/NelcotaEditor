export const FRAME_WIDTH = 1080;
export const FRAME_HEIGHT = 1920;

const CENTISECONDS_PER_SECOND = 100;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const TIME_PAD = 2;

function padTwoDigits(value: number): string {
    return String(value).padStart(TIME_PAD, "0");
}

export function toAssTime(seconds: number): string {
    const totalCentiseconds = Math.round(Math.max(0, seconds) * CENTISECONDS_PER_SECOND);
    const hours = Math.floor(totalCentiseconds / (SECONDS_PER_HOUR * CENTISECONDS_PER_SECOND));
    const minutes =
        Math.floor(totalCentiseconds / (SECONDS_PER_MINUTE * CENTISECONDS_PER_SECOND)) %
        SECONDS_PER_MINUTE;
    const wholeSeconds =
        Math.floor(totalCentiseconds / CENTISECONDS_PER_SECOND) % SECONDS_PER_MINUTE;
    const centiseconds = totalCentiseconds % CENTISECONDS_PER_SECOND;

    return `${hours}:${padTwoDigits(minutes)}:${padTwoDigits(wholeSeconds)}.${padTwoDigits(centiseconds)}`;
}

export function buildAssOverlay(
    styles: ReadonlyArray<string>,
    events: ReadonlyArray<string>,
): string {
    return [
        "[Script Info]",
        "ScriptType: v4.00+",
        `PlayResX: ${FRAME_WIDTH}`,
        `PlayResY: ${FRAME_HEIGHT}`,
        "WrapStyle: 2",
        "ScaledBorderAndShadow: yes",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        ...styles,
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
        ...events,
        "",
    ].join("\n");
}
