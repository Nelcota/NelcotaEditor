import { setInterval } from "node:timers/promises";
import { isFailureWorthLogging } from "#/modules/processing/server/failure-log-throttle";
import { shouldStopVideoRun } from "#/modules/video-records/server/video-progress.server";
import type { VideoRun } from "#/modules/video-records/server/video-progress.server";
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
    /** Ends the polling and waits for a check still in flight. */
    stop: () => Promise<void>;
}

interface PollTarget {
    run: VideoRun;
    controller: AbortController;
}

/** One poll; a failed check is logged (throttled) and the next tick tries again. */
async function checkOnce(target: PollTarget, consecutiveFailures: number): Promise<number> {
    const { run, controller } = target;
    const videoId = run.videoId;

    try {
        if ((await shouldStopVideoRun(run)) === true) {
            controller.abort(new VideoCancelledError(videoId));
        }

        logRecovery(videoId, consecutiveFailures);
        return 0;
    } catch (error) {
        const failures = consecutiveFailures + 1;
        logFailure(videoId, failures, error);
        return failures;
    }
}

/** Each check finishes before the next tick, so a slow database never piles up queries. */
async function pollTicks(ticks: AsyncIterable<PollTarget>): Promise<void> {
    let consecutiveFailures = 0;

    for await (const target of ticks) {
        if (target.controller.signal.aborted === true) {
            return;
        }

        consecutiveFailures = await checkOnce(target, consecutiveFailures);
    }
}

async function pollUntilStopped(target: PollTarget, stopSignal: AbortSignal): Promise<void> {
    const ticks = setInterval(POLL_INTERVAL_MILLISECONDS, target, { signal: stopSignal });

    try {
        await pollTicks(ticks);
    } catch (error) {
        if (stopSignal.aborted === true) {
            return;
        }

        throw error;
    }
}

/**
 * Polls the video and aborts the returned signal when the user cancels or deletes it, or when a
 * retry starts a newer run. Every long step (download, ffmpeg, Whisper, DeepSeek) listens to it.
 */
export function watchForCancellation(run: VideoRun): CancellationWatch {
    if (run.videoId.trim().length === 0) {
        throw new RangeError("Cannot watch cancellation of a video without an id");
    }

    const controller = new AbortController();
    const stopController = new AbortController();
    const polling = pollUntilStopped({ run, controller }, stopController.signal);

    const stop = async (): Promise<void> => {
        stopController.abort();
        await polling;
    };

    return { signal: controller.signal, stop };
}

function logFailure(videoId: string, consecutiveFailures: number, error: unknown): void {
    if (isFailureWorthLogging(consecutiveFailures) === false) {
        return;
    }

    logger.error({ videoId, consecutiveFailures, error }, "Could not check video cancellation");
}

function logRecovery(videoId: string, consecutiveFailures: number): void {
    if (consecutiveFailures === 0) {
        return;
    }

    logger.info({ videoId, consecutiveFailures }, "Video cancellation check recovered");
}
