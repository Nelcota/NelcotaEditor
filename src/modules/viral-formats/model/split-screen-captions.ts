import type {
    CutWord,
    SplitScreenPiece,
} from "#/modules/viral-formats/model/split-screen-timeline";

export const FRAME_WIDTH = 1080;
export const FRAME_HEIGHT = 1920;
/** The seam between the example on top and the presenter below (the format's REC-01). */
export const TOP_PANEL_HEIGHT = 952;
export const BOTTOM_PANEL_HEIGHT = FRAME_HEIGHT - TOP_PANEL_HEIGHT;

// REC-02: an 87 px white box centred on the seam (y 916 to 1003); on a full-screen stretch the
// caption drops to the chest (top at 1240) so it never covers the mouth.
const SEAM_CAPTION_CENTRE_Y = 960;
const CHEST_CAPTION_CENTRE_Y = 1284;
const CAPTION_CENTRE_X = FRAME_WIDTH / 2;
const FONT_SIZE = 57;
/** The box's inner margin, so the letters keep about 15 px from its edges. */
const BOX_PADDING = 13;
/** A pause shorter than this keeps the word on screen until the next one comes in. */
const HOLD_GAP_SECONDS = 0.12;
/** Three frames at 30 fps: a word never flashes shorter than this. */
const MIN_WORD_SECONDS = 0.1;
/** The entrance squeeze: 80 % wide to 100 % in 0.05 s. */
const ENTRANCE_MILLISECONDS = 50;
const ENTRANCE_SCALE_X = 80;
const CENTISECONDS_PER_SECOND = 100;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const TIME_PAD = 2;

function padTwoDigits(value: number): string {
    return String(value).padStart(TIME_PAD, "0");
}

/** ASS times are h:mm:ss.cc. */
function toAssTime(seconds: number): string {
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

/** ASS reads braces and backslashes as tags; spoken words never need them. */
function escapeAssText(text: string): string {
    return text.replace(/[{}\\]/gu, "");
}

function isInFullscreen(time: number, pieces: ReadonlyArray<SplitScreenPiece>): boolean {
    return pieces.some(
        (piece) => piece.kind === "fullscreen" && time >= piece.start && time < piece.end,
    );
}

/** Until the next word when the pause before it is short, else until the word ends. */
function toWordEnd(word: CutWord, next: CutWord | undefined): number {
    let end = word.end;

    if (next !== undefined && next.start - word.end < HOLD_GAP_SECONDS) {
        end = next.start;
    }

    return Math.max(end, word.start + MIN_WORD_SECONDS);
}

function buildHeader(): string {
    // BorderStyle 3 draws an opaque box in OutlineColour behind the text: white box, black words.
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
        `Style: Word,Inter,${FONT_SIZE},&H00000000,&H00000000,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,3,${BOX_PADDING},0,5,0,0,0,1`,
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ].join("\n");
}

/**
 * The format's caption: one word at a time in a white box on the seam, squeezed in from 80 %
 * wide, cut out dry, gone during pauses.
 */
export function buildWordCaptions(
    words: ReadonlyArray<CutWord>,
    pieces: ReadonlyArray<SplitScreenPiece>,
): string {
    const events = words.map((word, index) => {
        let centreY = SEAM_CAPTION_CENTRE_Y;

        if (isInFullscreen(word.start, pieces) === true) {
            centreY = CHEST_CAPTION_CENTRE_Y;
        }

        const tags = `{\\an5\\pos(${CAPTION_CENTRE_X},${centreY})\\fscx${ENTRANCE_SCALE_X}\\t(0,${ENTRANCE_MILLISECONDS},\\fscx100)}`;
        const start = toAssTime(word.start);
        const end = toAssTime(toWordEnd(word, words[index + 1]));

        return `Dialogue: 0,${start},${end},Word,,0,0,0,,${tags}${escapeAssText(word.text)}`;
    });

    return [buildHeader(), ...events, ""].join("\n");
}
