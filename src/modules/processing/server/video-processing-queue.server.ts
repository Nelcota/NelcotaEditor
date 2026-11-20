import { z } from "zod";
import { getJobQueue } from "#/shared/server/job-queue.server";

export const PROCESS_VIDEO_QUEUE = "process-video";

const SIX_HOURS_IN_SECONDS = 6 * 60 * 60;

export const processVideoJobSchema = z.object({ videoId: z.uuid() });

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

export async function enqueueVideoProcessing(videoId: string): Promise<void> {
    if (videoId.trim().length === 0) {
        throw new RangeError("Cannot enqueue processing for a video without an id");
    }

    await ensureProcessVideoQueue();
    const jobQueue = await getJobQueue();
    await jobQueue.send(PROCESS_VIDEO_QUEUE, { videoId }, { singletonKey: videoId });
}
