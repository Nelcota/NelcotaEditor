import type { ClipStatus } from "#/modules/clips/clip-status";

interface RenderedClipUpdate {
    status: ClipStatus;
    outputPath: string;
    outputBytes: number;
}

/**
 * The single write that finishes a render: the clip only becomes done together with its file and
 * that file's size, so a later failure can never flip a finished clip to failed.
 */
export function buildRenderedClipUpdate(
    outputPath: string,
    outputBytes: number,
): RenderedClipUpdate {
    if (outputPath.trim().length === 0) {
        throw new RangeError("A rendered clip needs the path of its file");
    }

    if (Number.isSafeInteger(outputBytes) === false || outputBytes < 0) {
        throw new RangeError(`Invalid size for rendered file ${outputPath}: ${outputBytes}`);
    }

    return { status: "done", outputPath, outputBytes };
}
