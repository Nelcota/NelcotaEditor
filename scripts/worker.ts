import { startAuthEmailWorker } from "#/modules/auth/server/auth-email-queue.server";
import { backfillStoredBytes } from "#/modules/processing/server/backfill-stored-bytes.server";
import { processVideo } from "#/modules/processing/server/process-video.server";
import {
    requeueInterruptedVideos,
    startStuckVideoRecovery,
} from "#/modules/processing/server/stuck-video-recovery.server";
import { removeAllVideoWorkspaces } from "#/modules/processing/server/video-workspace.server";
import { startExpiredUploadSweep } from "#/modules/videos/server/expired-upload-sweep.server";
import {
    ensureProcessVideoQueue,
    PROCESS_VIDEO_QUEUE,
    processVideoJobSchema,
} from "#/modules/processing/server/video-processing-queue.server";
import { findVideoById } from "#/modules/video-records/server/video-progress.server";
import { getEnvironment } from "#/shared/server/env.server";
import { getJobQueue, setJobQueueRole } from "#/shared/server/job-queue.server";
import { logger, withLogContext } from "#/shared/server/logger.server";

/** One person's videos run one after the other, so nobody waits behind someone else's batch. */
const VIDEOS_PER_USER_AT_ONCE = 1;

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

/**
 * Ids and timing only: titles, links and transcripts are the person's data. The job and video ids
 * come from the log context around the job.
 */
async function processVideoWithLogs(videoId: string): Promise<void> {
    const startedAt = Date.now();
    logger.info({}, "Job started");

    try {
        await processVideo(videoId);
    } catch (error) {
        // pg-boss only marks the job failed; this line is the one record of why.
        logger.error({ durationMs: Date.now() - startedAt, error }, "Job threw");
        throw error;
    }

    const status = await readFinalStatus(videoId);
    logger.info({ status, durationMs: Date.now() - startedAt }, "Job ended");
}

async function handleJob(job: ProcessVideoJob): Promise<void> {
    const result = processVideoJobSchema.safeParse(job.data);

    // Throwing makes pg-boss record the job as failed instead of silently completing it.
    if (result.success === false) {
        logger.error(
            { jobId: job.id, issueCount: result.error.issues.length },
            "Rejecting a job with an invalid payload",
        );
        throw new InvalidJobPayloadError(result.error.issues.length);
    }

    const videoId = result.data.videoId;
    await withLogContext({ jobId: job.id, videoId }, () => processVideoWithLogs(videoId));
}

async function startWorker(): Promise<void> {
    setJobQueueRole("worker");
    await ensureProcessVideoQueue();
    const jobQueue = await getJobQueue();

    const workerConcurrency = getEnvironment().WORKER_CONCURRENCY;

    // Jobs a dead worker held are failed by their heartbeat, so a start never touches the active
    // jobs of other replicas.
    await removeAllVideoWorkspaces();
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
    await startStuckVideoRecovery();
    await startExpiredUploadSweep();
    await startAuthEmailWorker();
    logger.info({ workerConcurrency }, "Worker ready");

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
        logger.error({ error }, "Worker did not stop gracefully");
        process.exit(1);
    });
}

await startWorker();
