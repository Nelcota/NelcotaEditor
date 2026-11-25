import type { Db as JobDatabase } from "pg-boss";
import { z } from "zod";
import { getJobQueue } from "#/shared/server/job-queue.server";

export const PROCESS_VIDEO_QUEUE = "process-video";

const SIX_HOURS_IN_SECONDS = 6 * 60 * 60;
// A worker refreshes the heartbeat every 30 s while it runs the job. When it dies (restart, crash,
// another replica going away), the job is failed a minute later instead of blocking the video's
// next job for hours, and no worker has to assume it is the only one.
const JOB_HEARTBEAT_SECONDS = 60;

export const processVideoJobSchema = z.object({
    videoId: z.uuid(),
    runStartedAt: z.iso.datetime().nullable().optional(),
});

export type ProcessVideoJob = z.infer<typeof processVideoJobSchema>;

let queueReadyPromise: Promise<void> | null = null;

async function createProcessVideoQueue(): Promise<void> {
    const jobQueue = await getJobQueue();
    // "stately" + singletonKey: at most one queued and one running job per video.
    // Failures are recorded on the video and retried by the user, so pg-boss does not retry.
    await jobQueue.createQueue(PROCESS_VIDEO_QUEUE, {
        policy: "stately",
        expireInSeconds: SIX_HOURS_IN_SECONDS,
        retryLimit: 0,
    });
}

/** A failed attempt is forgotten, so a database hiccup does not break every later enqueue. */
async function createProcessVideoQueueOrReset(): Promise<void> {
    try {
        await createProcessVideoQueue();
    } catch (error) {
        queueReadyPromise = null;
        throw error;
    }
}

export function ensureProcessVideoQueue(): Promise<void> {
    if (queueReadyPromise === null) {
        queueReadyPromise = createProcessVideoQueueOrReset();
    }

    return queueReadyPromise;
}

export interface VideoProcessingRequest {
    videoId: string;
    userId: string;
    processingStartedAt: Date | null;
    /** Seconds the job waits before a worker may take it; it starts at once when absent. */
    startAfterSeconds?: number;
}

/**
 * Pass the jobDatabase of an open transaction to send the job with the row that needs it: both
 * commit or neither does, so a failed request leaves no orphan job and no video without a job.
 */
export async function enqueueVideoProcessing(
    request: VideoProcessingRequest,
    jobDatabase: JobDatabase | null,
): Promise<void> {
    const { videoId, userId, processingStartedAt } = request;
    const startAfterSeconds = request.startAfterSeconds ?? 0;

    if (videoId.trim().length === 0) {
        throw new RangeError("Cannot enqueue processing for a video without an id");
    }

    if (userId.trim().length === 0) {
        throw new RangeError(`Cannot enqueue processing of video ${videoId} without its owner`);
    }

    if (Number.isFinite(startAfterSeconds) === false || startAfterSeconds < 0) {
        throw new RangeError(`Invalid start delay for video ${videoId}: ${startAfterSeconds}`);
    }

    await ensureProcessVideoQueue();
    const jobQueue = await getJobQueue();
    // The group lets the worker run one video per person at a time, so nobody waits behind
    // another person's whole batch.
    const options = {
        singletonKey: videoId,
        group: { id: userId },
        heartbeatSeconds: JOB_HEARTBEAT_SECONDS,
        startAfter: startAfterSeconds,
    };
    const payload = { videoId, runStartedAt: processingStartedAt?.toISOString() ?? null };

    if (jobDatabase === null) {
        await jobQueue.send(PROCESS_VIDEO_QUEUE, payload, options);
        return;
    }

    await jobQueue.send(PROCESS_VIDEO_QUEUE, payload, { ...options, db: jobDatabase });
}
