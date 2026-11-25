import { CLIP_POSTER_WIDTH } from "#/modules/clips/model/clip-poster-size";
import { localFileInput } from "#/shared/server/local-media-input.server";
import { logger } from "#/shared/server/logger.server";
import { runCommand } from "#/shared/server/run-command.server";

// A quarter in shows the first caption on screen; capped so long clips still open on their start.
const POSTER_POSITION_RATIO = 0.25;
const MAX_POSTER_SECOND = 3;
const TIME_DECIMALS = 2;
const JPEG_QUALITY = "4";

export interface ClipPosterFrame {
    clipId: string;
    renderedFilePath: string;
    durationSeconds: number;
    posterFilePath: string;
    signal: AbortSignal;
}

function buildPosterArguments(frame: ClipPosterFrame): Array<string> {
    const second = Math.min(frame.durationSeconds * POSTER_POSITION_RATIO, MAX_POSTER_SECOND);

    return [
        "-y",
        "-ss",
        second.toFixed(TIME_DECIMALS),
        ...localFileInput(frame.renderedFilePath),
        "-frames:v",
        "1",
        "-vf",
        `scale=${CLIP_POSTER_WIDTH}:-2`,
        "-q:v",
        JPEG_QUALITY,
        frame.posterFilePath,
    ];
}

/**
 * Saves one frame of the rendered clip, captions included, for link previews. Returns whether it
 * was written: a preview without an image is better than a clip marked as failed, so a failure is
 * logged and the render goes on. Cancellation is not a failure: it stops the render.
 */
export async function extractClipPoster(frame: ClipPosterFrame): Promise<boolean> {
    const { clipId, signal } = frame;

    try {
        await runCommand("ffmpeg", buildPosterArguments(frame), { signal });
        return true;
    } catch (error) {
        if (signal.aborted === true) {
            throw error;
        }

        logger.warn({ clipId, error }, "Could not create the clip poster");
        return false;
    }
}
