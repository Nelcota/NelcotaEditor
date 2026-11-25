import type { JobWithMetadata } from "pg-boss";
import { startAuthEmailWorker } from "#/modules/auth/server/auth-email-queue.server";
import { startStoredBytesBackfill } from "#/modules/processing/server/backfill-stored-bytes.server";
import { processVideo } from "#/modules/processing/server/process-video.server";
import {
    requeueInterruptedVideos,
    startStuckVideoRecovery,
} from "#/modules/processing/server/stuck-video-recovery.server";
import { removeAbandonedVideoWorkspaces } from "#/modules/processing/server/video-workspace.server";
import { startExpiredUploadSweep } from "#/modules/videos/server/expired-upload-sweep.server";
import {
    ensureProcessVideoQueue,
    PROCESS_VIDEO_QUEUE,
    processVideoJobSchema,
} from "#/modules/processing/server/video-processing-queue.server";
import type { ProcessVideoJob } from "#/modules/processing/server/video-processing-queue.server";
import { createVideoWorkSync } from "#/modules/processing/server/video-work-switch.server";
import { startIdleTicketClosing } from "#/modules/support/server/close-idle-tickets.server";
import { startSupportEmailWorker } from "#/modules/support/server/support-email-queue.server";
import { findVideoById } from "#/modules/video-records/server/video-progress.server";
import { startEditRenderWorker } from "#/modules/viral-formats/server/run-edit-render.server";
import { getEnvironment } from "#/shared/server/env.server";
import { getClipRenderCapacity } from "#/shared/server/clip-render-capacity.server";
import { getJobQueue, setJobQueueRole } from "#/shared/server/job-queue.server";
import { logger, withLogContext } from "#/shared/server/logger.server";

/** One person's videos run one after the other, so nobody waits behind someone else's batch. */
const VIDEOS_PER_USER_AT_ONCE = 1;

/** How long a pause or resume from the admin panel takes to reach this worker. */
const VIDEO_WORK_SWITCH_CHECK_MS = 10_000;

class InvalidJobPayloadError extends Error {
    constructor(issueCount: number) {
        super(
            `Job of queue ${PROCESS_VIDEO_QUEUE} has an invalid payload (${issueCount} issue(s))`,
        );
        this.name = "InvalidJobPayloadError";
    }
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
async function processVideoWithLogs(
    job: ProcessVideoJob,
    signal: AbortSignal,
    queueWaitMs: number,
): Promise<void> {
    const { videoId, runStartedAt } = job;
    const startedAt = performance.now();
    logger.info({ queueWaitMs }, "Job started");

    try {
        await processVideo(videoId, signal, runStartedAt);
    } catch (error) {
        // pg-boss only marks the job failed; this line is the one record of why.
        logger.error({ durationMs: Math.round(performance.now() - startedAt), error }, "Job threw");
        throw error;
    }

    const status = await readFinalStatus(videoId);
    logger.info({ status, durationMs: Math.round(performance.now() - startedAt) }, "Job ended");
}

async function handleJob(job: JobWithMetadata<unknown>): Promise<void> {
    const { id: jobId, data: payload, signal, createdOn, startAfter, startedOn } = job;
    const result = processVideoJobSchema.safeParse(payload);

    // Throwing makes pg-boss record the job as failed instead of silently completing it.
    if (result.success === false) {
        logger.error(
            { jobId, issueCount: result.error.issues.length },
            "Rejecting a job with an invalid payload",
        );
        throw new InvalidJobPayloadError(result.error.issues.length);
    }

    const processingJob = result.data;
    const videoId = processingJob.videoId;
    const eligibleAt = Math.max(createdOn.getTime(), startAfter.getTime());
    const queueWaitMs = Math.max(0, startedOn.getTime() - eligibleAt);
    await withLogContext({ jobId, videoId }, () =>
        processVideoWithLogs(processingJob, signal, queueWaitMs),
    );
}

async function startVideoWork(): Promise<void> {
    const jobQueue = await getJobQueue();
    const workerConcurrency = getEnvironment().WORKER_CONCURRENCY;

    // groupConcurrency is tracked in the database, so "one video per person" holds across replicas.
    await jobQueue.work(
        PROCESS_VIDEO_QUEUE,
        {
            includeMetadata: true,
            localConcurrency: workerConcurrency,
            groupConcurrency: VIDEOS_PER_USER_AT_ONCE,
        },
        async (jobs) => {
            for (const job of jobs) {
                await handleJob(job);
            }
        },
    );
}

async function stopVideoWork(): Promise<void> {
    const jobQueue = await getJobQueue();
    await jobQueue.offWork(PROCESS_VIDEO_QUEUE, { wait: true });
}

const syncVideoWork = createVideoWorkSync({
    startWork: startVideoWork,
    stopWork: stopVideoWork,
});

let isStopping = false;

/** A failed check keeps the current state; the next one tries again. */
async function syncVideoWorkAndReschedule(): Promise<void> {
    if (isStopping === true) {
        return;
    }

    try {
        await syncVideoWork();
    } catch (error) {
        logger.error({ error }, "Could not check the video processing switch");
    }

    scheduleVideoWorkSync();
}

// A timeout after each check instead of an interval: pausing waits for the running videos, and
// checks must never overlap.
function scheduleVideoWorkSync(): void {
    setTimeout(() => {
        syncVideoWorkAndReschedule().catch((error: unknown) => {
            logger.error({ error }, "Video processing switch watch stopped");
        });
    }, VIDEO_WORK_SWITCH_CHECK_MS);
}

async function startWorker(): Promise<void> {
    setJobQueueRole("worker");
    await ensureProcessVideoQueue();
    const {
        WORKER_CONCURRENCY: workerConcurrency,
        CLIP_RENDER_MAX_FPS: renderMaxFramesPerSecond,
        TRANSCRIPTION_CONCURRENCY: transcriptionConcurrency,
    } = getEnvironment();
    const { cpuBudget, concurrency, decoderThreads, encoderThreads } = getClipRenderCapacity();

    // Jobs a dead worker held are failed by their heartbeat, and workspaces are removed only when
    // their video's lock is free, so a start never touches the active runs of other replicas.
    await removeAbandonedVideoWorkspaces();
    await startStoredBytesBackfill();
    await requeueInterruptedVideos();
    await syncVideoWork();
    scheduleVideoWorkSync();
    await startStuckVideoRecovery();
    await startSupportEmailWorker();
    await startIdleTicketClosing();
    await startExpiredUploadSweep();
    await startAuthEmailWorker();
    await startEditRenderWorker();
    logger.info(
        {
            workerConcurrency,
            renderCpuBudget: cpuBudget,
            renderConcurrency: concurrency,
            renderDecoderThreads: Number(decoderThreads),
            renderEncoderThreads: Number(encoderThreads),
            renderMaxFramesPerSecond: renderMaxFramesPerSecond ?? null,
            transcriptionConcurrency,
        },
        "Worker ready",
    );

    process.once("SIGTERM", stopWorker);
    process.once("SIGINT", stopWorker);
}

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
