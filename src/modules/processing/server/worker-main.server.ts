import { inArray } from "drizzle-orm";
import { db } from "#/db/database.server";
import { backfillStoredBytes } from "#/modules/processing/server/backfill-stored-bytes.server";
import { processVideo } from "#/modules/processing/server/process-video.server";
import {
    enqueueVideoProcessing,
    ensureProcessVideoQueue,
    PROCESS_VIDEO_QUEUE,
    processVideoJobSchema,
} from "#/modules/processing/server/video-processing-queue.server";
import {
    findVideoById,
    markVideoCancelled,
} from "#/modules/video-records/server/video-progress.server";
import { WORKING_VIDEO_STATUSES } from "#/modules/video-records/video-status";
import type { VideoStatus } from "#/modules/video-records/video-status";
import { videos } from "#/modules/video-records/videos.schema";
import { getEnvironment } from "#/shared/server/env.server";
import { getJobQueue, setJobQueueRole } from "#/shared/server/job-queue.server";

/** One person's videos run one after the other, so nobody waits behind someone else's batch. */
const VIDEOS_PER_USER_AT_ONCE = 1;

/**
 * Videos left half-done by a previous worker (restart, crash) are queued again,
 * unless the user had asked to cancel them.
 */
// "queued" too: a job can die before the first stage update. A video another replica is still
// processing gets at most one extra queued job (stately queue), which its processing lock or its
// finished status turns into a no-op.
const RESUMABLE_ON_START_STATUSES: Array<VideoStatus> = ["queued", ...WORKING_VIDEO_STATUSES];

async function requeueInterruptedVideos(): Promise<void> {
    const interrupted = await db
        .select({ id: videos.id, userId: videos.userId, cancelRequested: videos.cancelRequested })
        .from(videos)
        .where(inArray(videos.status, RESUMABLE_ON_START_STATUSES));

    for (const video of interrupted) {
        if (video.cancelRequested === true) {
            await markVideoCancelled(video.id);
            continue;
        }

        await enqueueVideoProcessing({ videoId: video.id, userId: video.userId }, null);
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

interface ProcessVideoJob {
    id: string;
    data: unknown;
}

/** The status the video ended in; a video deleted while processing has none. */
async function readFinalStatus(videoId: string): Promise<string> {
    const video = await findVideoById(videoId);

    if (video === null) {
        return "deleted";
    }

    return video.status;
}

/** Ids and timing only: titles, links and transcripts are the person's data. */
async function processVideoWithLogs(videoId: string, jobId: string): Promise<void> {
    const startedAt = Date.now();
    console.info(`Job ${jobId} started for video ${videoId}.`);

    try {
        await processVideo(videoId);
    } catch (error) {
        console.error(
            `Job ${jobId} for video ${videoId} threw after ${Date.now() - startedAt} ms.`,
        );
        throw error;
    }

    const status = await readFinalStatus(videoId);
    const durationMs = Date.now() - startedAt;
    console.info(`Job ${jobId} ended for video ${videoId}: status ${status}, ${durationMs} ms.`);
}

async function handleJob(job: ProcessVideoJob): Promise<void> {
    const result = processVideoJobSchema.safeParse(job.data);

    // Throwing makes pg-boss record the job as failed instead of silently completing it.
    if (result.success === false) {
        console.error(`Rejecting job ${job.id} with invalid payload`, result.error.issues);
        throw new InvalidJobPayloadError(result.error.issues.length);
    }

    await processVideoWithLogs(result.data.videoId, job.id);
}

async function startWorker(): Promise<void> {
    setJobQueueRole("worker");
    await ensureProcessVideoQueue();
    const jobQueue = await getJobQueue();

    const workerConcurrency = getEnvironment().WORKER_CONCURRENCY;

    // Jobs a dead worker held are failed by their heartbeat, so a start never touches the active
    // jobs of other replicas.
    await backfillStoredBytes();
    await requeueInterruptedVideos();
    // groupConcurrency is tracked in the database, so "one video per person" holds across replicas.
    await jobQueue.work(
        PROCESS_VIDEO_QUEUE,
        { localConcurrency: workerConcurrency, groupConcurrency: VIDEOS_PER_USER_AT_ONCE },
        async (jobs) => {
            for (const job of jobs) {
                await handleJob(job);
            }
        },
    );
    console.info(`Worker ready, processing up to ${workerConcurrency} video(s) at once.`);

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
