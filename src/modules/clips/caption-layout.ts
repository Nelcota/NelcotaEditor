import { ASPECT_RATIO_SIZES } from "#/modules/clips/clip-format";
import type { AspectRatio } from "#/modules/clips/clip-format";
import { CAPTION_FONT_FACES, CAPTION_SIZE_SCALES } from "#/modules/clips/caption-style";
import type { CaptionFont, CaptionPosition, CaptionSize } from "#/modules/clips/caption-style";

interface BaseLayout {
    fontSize: number;
    /** Distance from the frame edge when the caption sits at the top or the bottom. */
    edgeMargin: number;
}

// Captions sit in the lower third; the square and wide frames are shorter, so they sit lower.
const BASE_LAYOUTS: Record<AspectRatio, BaseLayout> = {
    vertical: { fontSize: 96, edgeMargin: 560 },
    square: { fontSize: 80, edgeMargin: 150 },
    horizontal: { fontSize: 72, edgeMargin: 90 },
};

/** Where and how big the caption is, in the rendered frame's pixels. */
export interface CaptionPlacement {
    frameWidth: number;
    frameHeight: number;
    fontSize: number;
    position: CaptionPosition;
    /** Distance from the top (position "top") or the bottom (position "bottom"); 0 in the middle. */
    marginVertical: number;
    /** Left and right padding the text never crosses. */
    marginHorizontal: number;
}

const HORIZONTAL_MARGIN = 90;

export interface CaptionLook {
    aspectRatio: AspectRatio;
    size: CaptionSize;
    position: CaptionPosition;
    font: CaptionFont;
}

/** The one source for caption placement: the burned-in subtitles and the live preview both use it. */
export function resolveCaptionPlacement(look: CaptionLook): CaptionPlacement {
    const { aspectRatio, size, position, font } = look;
    const frame = ASPECT_RATIO_SIZES[aspectRatio];
    const base = BASE_LAYOUTS[aspectRatio];
    const scale = CAPTION_SIZE_SCALES[size] * CAPTION_FONT_FACES[font].sizeScale;
    const fontSize = Math.round(base.fontSize * scale);
    let marginVertical = base.edgeMargin;

    if (position === "middle") {
        marginVertical = 0;
    }

    return {
        frameWidth: frame.width,
        frameHeight: frame.height,
        fontSize,
        position,
        marginVertical,
        marginHorizontal: HORIZONTAL_MARGIN,
    };
}
