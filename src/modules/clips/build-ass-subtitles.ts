import { resolveCaptionPlacement } from "#/modules/clips/caption-layout";
import type { CaptionPlacement } from "#/modules/clips/caption-layout";
import { CAPTION_COLOR_HEX, CAPTION_FONT_FACES } from "#/modules/clips/caption-style";
import type {
    CaptionColor,
    CaptionFont,
    CaptionPosition,
    CaptionSize,
} from "#/modules/clips/caption-style";
import type { AspectRatio, CaptionStyle } from "#/modules/clips/clip-format";
import type { CaptionCue, CaptionWord } from "#/modules/clips/clip-studio.schema";

const LAST_WORD_HOLD_SECONDS = 0.3;
const MIN_EVENT_SECONDS = 0.05;

export interface CaptionRenderOptions {
    aspectRatio: AspectRatio;
    style: CaptionStyle;
    color: CaptionColor;
    size: CaptionSize;
    position: CaptionPosition;
    font: CaptionFont;
}

// ASS alignment uses the numeric keypad: 2 = bottom centre, 5 = middle centre, 8 = top centre.
const ASS_ALIGNMENTS: Record<CaptionPosition, number> = { bottom: 2, middle: 5, top: 8 };
const HEX_COLOUR = /^#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i;

export class InvalidCaptionColourError extends Error {
    constructor(hex: string) {
        super(`Caption colour is not a #RRGGBB value: ${hex}`);
        this.name = "InvalidCaptionColourError";
    }
}

/** ASS colours are &HAABBGGRR. */
function toAssColour(color: CaptionColor): string {
    const hex = CAPTION_COLOR_HEX[color];
    const match = HEX_COLOUR.exec(hex);

    if (match === null) {
        throw new InvalidCaptionColourError(hex);
    }

    const [, red, green, blue] = match;

    return `&H00${blue}${green}${red}&`.toUpperCase();
}

// ASS uses -1 for bold and 0 for regular.
const ASS_BOLD = -1;
const ASS_REGULAR = 0;

function buildAssHeader(placement: CaptionPlacement, font: CaptionFont): string {
    const alignment = ASS_ALIGNMENTS[placement.position];
    const margin = placement.marginHorizontal;
    const face = CAPTION_FONT_FACES[font];
    let bold = ASS_REGULAR;

    if (face.isBold === true) {
        bold = ASS_BOLD;
    }

    return [
        "[Script Info]",
        "ScriptType: v4.00+",
        `PlayResX: ${placement.frameWidth}`,
        `PlayResY: ${placement.frameHeight}`,
        "WrapStyle: 0",
        "ScaledBorderAndShadow: yes",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        `Style: Caption,${face.family},${placement.fontSize},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,${bold},0,0,0,100,100,0,0,1,7,3,${alignment},${margin},${margin},${placement.marginVertical},1`,
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ].join("\n");
}

const CENTISECONDS_PER_SECOND = 100;
const CENTISECONDS_PER_MINUTE = 6000;
const CENTISECONDS_PER_HOUR = 360_000;

function pad(value: number): string {
    return String(value).padStart(2, "0");
}

export class InvalidSubtitleTimeError extends Error {
    constructor(seconds: number) {
        super(`Subtitle time is not a finite number: ${String(seconds)}`);
        this.name = "InvalidSubtitleTimeError";
    }
}

function formatAssTime(totalSeconds: number): string {
    if (Number.isFinite(totalSeconds) === false) {
        throw new InvalidSubtitleTimeError(totalSeconds);
    }

    const centiseconds = Math.max(0, Math.round(totalSeconds * CENTISECONDS_PER_SECOND));
    const hours = Math.floor(centiseconds / CENTISECONDS_PER_HOUR);
    const minutes = Math.floor((centiseconds % CENTISECONDS_PER_HOUR) / CENTISECONDS_PER_MINUTE);
    const seconds = Math.floor((centiseconds % CENTISECONDS_PER_MINUTE) / CENTISECONDS_PER_SECOND);
    const fraction = centiseconds % CENTISECONDS_PER_SECOND;

    return `${hours}:${pad(minutes)}:${pad(seconds)}.${pad(fraction)}`;
}

/**
 * Braces and backslashes are ASS override syntax and a line break would end the Dialogue line;
 * none of them may come from the transcript.
 */
function sanitizeWord(text: string): string {
    return text
        .replace(/[{}\\]/g, "")
        .replace(/[\r\n]+/g, " ")
        .toUpperCase();
}

/** A highlightedIndex of -1 highlights nothing: the plain white style. */
const NO_HIGHLIGHT_INDEX = -1;

function buildGroupText(
    group: Array<CaptionWord>,
    highlightedIndex: number,
    highlightColour: string,
): string {
    return group
        .map((word, index) => {
            const text = sanitizeWord(word.text);

            if (index === highlightedIndex) {
                return `{\\c${highlightColour}}${text}{\\r}`;
            }

            return text;
        })
        .join(" ");
}

/**
 * A highlighted word stays on screen until the next word starts, so the caption never flickers.
 * The last word of a group lingers briefly, but never past the start of the next group.
 */
function wordEndSeconds(
    word: CaptionWord,
    nextWord: CaptionWord | undefined,
    nextGroupStart: number,
): number {
    if (nextWord === undefined) {
        return Math.min(word.endSeconds + LAST_WORD_HOLD_SECONDS, nextGroupStart);
    }

    return nextWord.startSeconds;
}

function buildGroupEvents(
    group: Array<CaptionWord>,
    nextGroupStart: number,
    options: CaptionRenderOptions,
): Array<string> {
    const highlightColour = toAssColour(options.color);

    return group.flatMap((word, index) => {
        const start = word.startSeconds;
        const nextWord = group[index + 1];
        const nextStart = nextWord?.startSeconds ?? nextGroupStart;
        const stretchedEnd = Math.max(
            start + MIN_EVENT_SECONDS,
            wordEndSeconds(word, nextWord, nextGroupStart),
        );
        // The minimum length must not push a word over the next one: two caption lines would
        // show at once. When there is no room at all, the word keeps its tiny slot.
        const end = Math.min(stretchedEnd, Math.max(nextStart, start + Number.EPSILON));
        const formattedStart = formatAssTime(start);
        const formattedEnd = formatAssTime(end);

        // A slot under a hundredth rounds to an event that ends where it starts; drop it rather
        // than write a line that never shows.
        if (formattedEnd === formattedStart) {
            return [];
        }

        const highlightedIndex = resolveHighlightedIndex(options.style, index);
        const text = buildGroupText(group, highlightedIndex, highlightColour);

        return [`Dialogue: 0,${formattedStart},${formattedEnd},Caption,,0,0,0,,${text}`];
    });
}

function resolveHighlightedIndex(style: CaptionStyle, wordIndex: number): number {
    if (style === "karaoke") {
        return wordIndex;
    }

    return NO_HIGHLIGHT_INDEX;
}

function cueStartSeconds(cue: CaptionCue | undefined): number {
    if (cue === undefined) {
        return Number.POSITIVE_INFINITY;
    }

    return cue.startSeconds;
}

/**
 * Builds the burned-in captions: each cue on screen with the spoken word highlighted (karaoke) or
 * plain. Cue and word times must already be relative to the start of the clip.
 */
export function buildAssSubtitles(cues: Array<CaptionCue>, options: CaptionRenderOptions): string {
    const placement = resolveCaptionPlacement({
        aspectRatio: options.aspectRatio,
        size: options.size,
        position: options.position,
        font: options.font,
    });
    const events = cues.flatMap((cue, index) =>
        buildGroupEvents(cue.words, cueStartSeconds(cues[index + 1]), options),
    );

    return `${buildAssHeader(placement, options.font)}\n${events.join("\n")}\n`;
}
