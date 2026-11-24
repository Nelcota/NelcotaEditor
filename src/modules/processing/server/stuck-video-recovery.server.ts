import { inArray } from "drizzle-orm";
import { db } from "#/db/database.server";
import { findVideosWithoutJob } from "#/modules/processing/server/find-videos-without-job.server";
import type { VideoWithoutJob } from "#/modules/processing/server/find-videos-without-job.server";
import { enqueueVideoProcessing } from "#/modules/processing/server/video-processing-queue.server";
import { WORKING_VIDEO_STATUSES } from "#/modules/video-records/model/video-status";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import {
    markVideoCancelled,
    toVideoRun,
} from "#/modules/video-records/server/video-progress.server";
import { videos } from "#/modules/video-records/video-records.schema";
import { getJobQueue } from "#/shared/server/job-queue.server";
import { logger } from "#/shared/server/logger.server";

const STUCK_VIDEO_RECOVERY_QUEUE = "recover-stuck-videos";
const EVERY_FIVE_MINUTES = "*/5 * * * *";

// "queued" too: a job can die before the first stage update. A video another replica is still
// processing gets at most one extra queued job (stately queue), which its processing lock or its
// finished status turns into a no-op.
const RESUMABLE_ON_START_STATUSES: Array<VideoStatus> = ["queued", ...WORKING_VIDEO_STATUSES];

/** Queued again with its owner as the group, so one person's videos still run one at a time. */
async function requeueOrCancel(stuckVideos: Array<VideoWithoutJob>): Promise<void> {
    for (const video of stuckVideos) {
        if (video.cancelRequested === true) {
            await markVideoCancelled(toVideoRun(video));
            continue;
        }

        await enqueueVideoProcessing({ videoId: video.id, userId: video.userId }, null);
    }
}

/**
 * Videos left half-done by a previous worker (restart, crash) are queued again at once, unless the
 * user had asked to cancel them. The periodic recovery would find them too, only later.
 */
export async function requeueInterruptedVideos(): Promise<void> {
    const interrupted = await db
        .select({
            id: videos.id,
            userId: videos.userId,
            cancelRequested: videos.cancelRequested,
            processingStartedAt: videos.processingStartedAt,
        })
        .from(videos)
        .where(inArray(videos.status, RESUMABLE_ON_START_STATUSES));

    await requeueOrCancel(interrupted);

    if (interrupted.length > 0) {
        logger.info({ videoCount: interrupted.length }, "Interrupted videos requeued");
    }
}

async function recoverStuckVideos(): Promise<void> {
    try {
        const stuckVideos = await findVideosWithoutJob();
        await requeueOrCancel(stuckVideos);

        if (stuckVideos.length > 0) {
            logger.warn({ videoCount: stuckVideos.length }, "Stuck videos requeued");
        }
    } catch (error) {
        // The next run tries again; the job is only marked failed.
        logger.error({ error }, "Could not recover stuck videos");
        throw error;
    }
}

/**
 * Every few minutes, queues again the unfinished videos whose job died while the worker kept
 * running: a stop that could not be recorded, a heartbeat that failed the job, a lock another run
 * held. The schedule lives in the database, so replicas share one; any of them may take each run.
 */
export async function startStuckVideoRecovery(): Promise<void> {
    const jobQueue = await getJobQueue();

    await jobQueue.createQueue(STUCK_VIDEO_RECOVERY_QUEUE, { policy: "singleton", retryLimit: 0 });
    await jobQueue.schedule(STUCK_VIDEO_RECOVERY_QUEUE, EVERY_FIVE_MINUTES);
    await jobQueue.work(STUCK_VIDEO_RECOVERY_QUEUE, recoverStuckVideos);
}
