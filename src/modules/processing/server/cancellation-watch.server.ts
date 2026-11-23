import { isFailureWorthLogging } from "#/modules/processing/server/failure-log-throttle";
import { isCancelRequested } from "#/modules/video-records/server/video-progress.server";
import { logger } from "#/shared/server/logger.server";

const POLL_INTERVAL_MILLISECONDS = 2_000;

export class VideoCancelledError extends Error {
    constructor(videoId: string) {
        super(`Processing of video ${videoId} was cancelled`);
        this.name = "VideoCancelledError";
    }
}

export interface CancellationWatch {
    signal: AbortSignal;
    stop: () => void;
}

/**
 * Polls the video's cancel flag and aborts the returned signal when the user cancels.
 * Every long step (download, ffmpeg, Whisper, DeepSeek) listens to this signal.
 */
export function watchForCancellation(videoId: string): CancellationWatch {
    if (videoId.trim().length === 0) {
        throw new RangeError("Cannot watch cancellation of a video without an id");
    }

    const controller = new AbortController();
    const signal = controller.signal;
    let isChecking = false;
    let consecutiveFailures = 0;

    const check = async (): Promise<void> => {
        if ((await isCancelRequested(videoId)) === true) {
            controller.abort(new VideoCancelledError(videoId));
        }
    };

    const checkInBackground = async (): Promise<void> => {
        // A slow database must not pile up overlapping queries for the same video.
        if (isChecking === true || signal.aborted === true) {
            return;
        }

        isChecking = true;

        try {
            await check();
            logRecovery(videoId, consecutiveFailures);
            consecutiveFailures = 0;
        } catch (error) {
            consecutiveFailures += 1;
            logFailure(videoId, consecutiveFailures, error);
        } finally {
            isChecking = false;
        }
    };

    const timer = setInterval(() => {
        void checkInBackground();
    }, POLL_INTERVAL_MILLISECONDS);

    return { signal, stop: () => clearInterval(timer) };
}

function logFailure(videoId: string, consecutiveFailures: number, error: unknown): void {
    if (isFailureWorthLogging(consecutiveFailures) === false) {
        return;
    }

    logger.error("Could not check video cancellation", { videoId, consecutiveFailures, error });
}

function logRecovery(videoId: string, consecutiveFailures: number): void {
    if (consecutiveFailures === 0) {
        return;
    }

    logger.info("Video cancellation check recovered", { videoId, consecutiveFailures });
}
