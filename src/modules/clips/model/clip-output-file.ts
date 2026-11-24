const CLIP_OUTPUT_EXTENSION = ".mp4";

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
