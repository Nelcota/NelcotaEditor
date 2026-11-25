const CLIP_OUTPUT_EXTENSION = ".mp4";
const CLIP_POSTER_EXTENSION = ".jpg";

/**
 * The rendered file's name. The draft version moves forward on every Studio render, so a new
 * render never writes over the previous file and that file can be removed at any time.
 */
export function buildClipOutputFileName(clipId: string, draftVersion: number): string {
    if (clipId.trim().length === 0) {
        throw new RangeError("Cannot name the output of a clip without an id");
    }

    if (Number.isSafeInteger(draftVersion) === false || draftVersion < 0) {
        throw new RangeError(`Invalid draft version for clip ${clipId}: ${draftVersion}`);
    }

    return `${clipId}-v${draftVersion}${CLIP_OUTPUT_EXTENSION}`;
}

/** The poster sits beside its render with the same name, so the two are removed together. */
export function toClipPosterFileName(outputFileName: string): string {
    if (outputFileName.endsWith(CLIP_OUTPUT_EXTENSION) === false) {
        throw new RangeError(`Not a rendered clip file: ${outputFileName}`);
    }

    return `${outputFileName.slice(0, -CLIP_OUTPUT_EXTENSION.length)}${CLIP_POSTER_EXTENSION}`;
}
