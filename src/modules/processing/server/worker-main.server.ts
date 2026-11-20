import { inArray } from "drizzle-orm";
import { db } from "#/db/database.server";
import { processVideo } from "#/modules/processing/server/process-video.server";
import {
    enqueueVideoProcessing,
    ensureProcessVideoQueue,
    PROCESS_VIDEO_QUEUE,
    processVideoJobSchema,
} from "#/modules/processing/server/video-processing-queue.server";
import { markVideoCancelled } from "#/modules/videos/server/video-progress.server";
import { WORKING_VIDEO_STATUSES } from "#/modules/videos/video-status";
import { videos } from "#/modules/videos/videos.schema";
import { getJobQueue } from "#/shared/server/job-queue.server";

/**
 * There is a single worker, so any job still "active" when it starts was orphaned by a restart.
 * Left alone, it would block the video's new job until it expires hours later.
 */
async function releaseOrphanedJobs(): Promise<void> {
    const jobQueue = await getJobQueue();
    const jobs = await jobQueue.findJobs(PROCESS_VIDEO_QUEUE);
    const orphanedIds = jobs.filter((job) => job.state === "active").map((job) => job.id);

    if (orphanedIds.length === 0) {
        return;
    }

    await jobQueue.fail(PROCESS_VIDEO_QUEUE, orphanedIds, { reason: "worker restarted" });
    console.info(`Released ${orphanedIds.length} orphaned job(s).`);
}

/**
 * Videos left half-done by a previous worker (restart, crash) are queued again,
 * unless the user had asked to cancel them.
 */
async function requeueInterruptedVideos(): Promise<void> {
    const interrupted = await db
        .select({ id: videos.id, cancelRequested: videos.cancelRequested })
        .from(videos)
        .where(inArray(videos.status, WORKING_VIDEO_STATUSES));

    for (const video of interrupted) {
        if (video.cancelRequested === true) {
            await markVideoCancelled(video.id);
            continue;
        }

        await enqueueVideoProcessing(video.id);
    }

    if (interrupted.length > 0) {
        console.info(`Requeued ${interrupted.length} interrupted video(s).`);
    }
}

class InvalidJobPayloadError extends Error {
    constructor(issueCount: number) {
        super(
            `Job of queue ${PROCESS_VIDEO_QUEUE} has an invalid payload (${issueCount} issue(s))`,
        );
        this.name = "InvalidJobPayloadError";
    }
}

async function handleJob(jobData: unknown): Promise<void> {
    const result = processVideoJobSchema.safeParse(jobData);

    // Throwing makes pg-boss record the job as failed instead of silently completing it.
    if (result.success === false) {
        console.error("Rejecting job with invalid payload", result.error.issues);
        throw new InvalidJobPayloadError(result.error.issues.length);
    }

    await processVideo(result.data.videoId);
}

async function startWorker(): Promise<void> {
    await ensureProcessVideoQueue();
    const jobQueue = await getJobQueue();

    await releaseOrphanedJobs();
    await requeueInterruptedVideos();
    await jobQueue.work(PROCESS_VIDEO_QUEUE, async (jobs) => {
        for (const job of jobs) {
            await handleJob(job.data);
        }
    });
    console.info("Worker ready, waiting for videos.");

    process.once("SIGTERM", stopWorker);
    process.once("SIGINT", stopWorker);
}

let isStopping = false;

async function stopGracefully(): Promise<void> {
    const jobQueue = await getJobQueue();
    await jobQueue.stop({ graceful: true });
    process.exit(0);
}

function stopWorker(): void {
    // SIGINT and SIGTERM can both arrive; stopping pg-boss twice would race the exit.
    if (isStopping === true) {
        return;
    }

    isStopping = true;
    stopGracefully().catch((error: unknown) => {
        console.error("Worker did not stop gracefully", error);
        process.exit(1);
    });
}

await startWorker();
