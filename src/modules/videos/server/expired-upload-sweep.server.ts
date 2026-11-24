import { removeExpiredUploads } from "#/modules/videos/server/pending-uploads.server";
import { getJobQueue } from "#/shared/server/job-queue.server";
import { logger } from "#/shared/server/logger.server";

const EXPIRED_UPLOAD_SWEEP_QUEUE = "remove-expired-uploads";
const EVERY_HOUR = "0 * * * *";

async function sweepExpiredUploads(): Promise<void> {
    try {
        await removeExpiredUploads();
    } catch (error) {
        // The next hour tries again; the job is only marked failed.
        logger.error({ error }, "Could not remove expired uploads");
        throw error;
    }
}

/**
 * Queues a sweep now, for what piled up while no worker ran, then every hour. The schedule lives
 * in the database, so replicas share one; any of them may take each run. The first run is a job
 * too: a store that is down at boot fails that job, not the worker's start.
 */
export async function startExpiredUploadSweep(): Promise<void> {
    const jobQueue = await getJobQueue();

    await jobQueue.createQueue(EXPIRED_UPLOAD_SWEEP_QUEUE, { policy: "singleton", retryLimit: 0 });
    await jobQueue.schedule(EXPIRED_UPLOAD_SWEEP_QUEUE, EVERY_HOUR);
    await jobQueue.work(EXPIRED_UPLOAD_SWEEP_QUEUE, sweepExpiredUploads);
    await jobQueue.send(EXPIRED_UPLOAD_SWEEP_QUEUE);
}
