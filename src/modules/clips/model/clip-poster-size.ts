import { ASPECT_RATIO_SIZES } from "#/modules/clips/model/clip-format";
import type { AspectRatio } from "#/modules/clips/model/clip-format";

/** Previews show the image small; this width keeps a vertical poster near 100 KB. */
export const CLIP_POSTER_WIDTH = 720;

interface PosterSize {
    width: number;
    height: number;
}

/** The poster's size for a clip shape, rounded to an even height like ffmpeg's `scale=w:-2`. */
export function toClipPosterSize(aspectRatio: AspectRatio): PosterSize {
    const { width, height } = ASPECT_RATIO_SIZES[aspectRatio];
    const scaledHeight = (height * CLIP_POSTER_WIDTH) / width;

    return { width: CLIP_POSTER_WIDTH, height: Math.round(scaledHeight / 2) * 2 };
}
