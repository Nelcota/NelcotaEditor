import { setTimeout as delay } from "node:timers/promises";
import { ensureHighlights } from "#/modules/highlights/server/select-highlights.server";
import { watchForCancellation } from "#/modules/processing/server/cancellation-watch.server";
import { renderPendingClips } from "#/modules/processing/server/render-pending-clips.server";
import { runWithVideoProcessingLock } from "#/modules/processing/server/video-processing-lock.server";
import { ensureTranscript } from "#/modules/transcription/server/transcribe-video.server";
import { prepareVideoSource } from "#/modules/processing/server/prepare-video-source.server";
import {
    createVideoWorkspace,
    removeVideoWorkspace,
} from "#/modules/processing/server/video-workspace.server";
import { toOverallPercent } from "#/modules/processing/model/processing-stages";
import {
    findVideoById,
    markVideoCancelled,
    markVideoDone,
    markVideoFailed,
    toVideoRun,
    updateVideoStage,
} from "#/modules/video-records/server/video-progress.server";
import type { VideoRun } from "#/modules/video-records/server/video-progress.server";
import { isVideoFinished } from "#/modules/video-records/model/video-status";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import type { Video } from "#/modules/video-records/video-records.schema";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { getVideoDirectory } from "#/shared/server/storage.server";
import { toUserMessage } from "#/shared/server/user-facing-error";
import { logger } from "#/shared/server/logger.server";

/**
 * Stages report their own progress (0 to 100); the pipeline owns how that maps onto the whole run,
 * so the stage modules never depend on processing.
 */
function saveStageProgress(
    videoId: string,
    status: VideoStatus,
): (stagePercent: number) => Promise<void> {
    return (stagePercent) =>
        updateVideoStage(videoId, status, toOverallPercent(status, stagePercent));
}

/**
 * The whole pipeline: source → transcript → highlights → clips.
 * Every step skips work that is already saved, so running it again resumes where it stopped.
 */
async function runStages(video: Video, workDirectory: string, signal: AbortSignal): Promise<void> {
    const videoId = video.id;
    const source = await prepareVideoSource(video, { signal, workDirectory });
    const localSourcePath = source.localSourcePath;
    const words = await ensureTranscript({
        videoId,
        localSourcePath,
        workDirectory,
        language: video.transcriptionLanguage,
        signal,
        saveProgress: saveStageProgress(videoId, "transcribing"),
    });
    const clips = await ensureHighlights({
        video,
        words,
        durationSeconds: source.durationSeconds,
        signal,
        saveProgress: saveStageProgress(videoId, "selecting"),
    });

    await renderPendingClips({ videoId, localSourcePath, workDirectory, clips, words, signal });
    signal.throwIfAborted();

    // A cancel that arrived after the last step still wins over "done".
    const run = toVideoRun(video);

    if ((await markVideoDone(run)) === false) {
        // Records nothing unless this run was the one the user cancelled.
        await markVideoCancelled(run);
    }
}

async function runPipeline(video: Video, signal: AbortSignal): Promise<void> {
    const videoId = video.id;
    const workDirectory = await createVideoWorkspace(videoId);

    try {
        await runStages(video, workDirectory, signal);
    } finally {
        await removeVideoWorkspace(videoId);
    }
}

/**
 * A video deleted while the worker held it ("queued" videos can be deleted) reads as cancelled.
 * Steps that ran meanwhile may have re-created its folder, so remove what nothing will ever own.
 */
async function removeFilesOfDeletedVideo(videoId: string): Promise<void> {
    const video = await findVideoById(videoId);

    if (video !== null) {
        return;
    }

    await getFileStorage().deleteFolder(getVideoDirectory(videoId));
}

const RECORD_STOP_ATTEMPTS = 3;
const RECORD_STOP_RETRY_DELAY_MILLISECONDS = 2_000;

/**
 * An aborted run records a cancel, which applies only when the user asked for it: a run aborted
 * because a retry took the video leaves it to the new run.
 */
async function writeStop(run: VideoRun, error: unknown, signal: AbortSignal): Promise<void> {
    if (signal.aborted === true) {
        await markVideoCancelled(run);
        return;
    }

    await markVideoFailed(run, toUserMessage(error));
}

/** Returns the database error instead of throwing it, so the caller can retry. */
async function tryWriteStop(run: VideoRun, error: unknown, signal: AbortSignal): Promise<unknown> {
    try {
        await writeStop(run, error, signal);
        return null;
    } catch (writeError) {
        return writeError;
    }
}

/**
 * Records why the run stopped, retrying a database that is briefly away: without this write the
 * video would look stuck in its last stage. After the last attempt the error propagates, the job
 * fails, and the stuck video recovery queues the video again.
 */
async function recordStop(run: VideoRun, error: unknown, signal: AbortSignal): Promise<void> {
    const videoId = run.videoId;

    if (signal.aborted === true) {
        logger.info({ videoId }, "Video run stopped");
    }

    if (signal.aborted === false) {
        // The failure is recorded on the video so the user sees it and can retry.
        logger.error({ videoId, error }, "Failed to process video");
    }

    for (let attempt = 1; attempt <= RECORD_STOP_ATTEMPTS; attempt += 1) {
        const writeError = await tryWriteStop(run, error, signal);

        if (writeError === null) {
            return;
        }

        logger.error(
            {
                videoId,
                attempt,
                maxAttempts: RECORD_STOP_ATTEMPTS,
                error: writeError,
            },
            "Could not record the video stop",
        );

        if (attempt === RECORD_STOP_ATTEMPTS) {
            throw writeError;
        }

        await delay(RECORD_STOP_RETRY_DELAY_MILLISECONDS);
    }
}

async function runAndRecord(video: Video): Promise<void> {
    const run = toVideoRun(video);
    const cancellation = watchForCancellation(run);

    try {
        await runPipeline(video, cancellation.signal);
    } catch (error) {
        await recordStop(run, error, cancellation.signal);
    } finally {
        await cancellation.stop();
    }

    await removeFilesOfDeletedVideo(video.id);
}

/**
 * Read under the lock, after any earlier run let go of the video, so this run carries the start
 * time of the request it serves.
 */
async function runIfStillQueued(videoId: string): Promise<void> {
    const video = await findVideoById(videoId);

    // Finished, cancelled or deleted while waiting in the queue: nothing to do.
    if (video === null || isVideoFinished(video.status) === true) {
        return;
    }

    await runAndRecord(video);
}

/**
 * Two workers (replicas, an overlapping restart) never process the same video at once. A job that
 * finds the lock taken ends here; if the video is still unfinished once the holder lets go, the
 * stuck video recovery queues it again.
 */
export async function processVideo(videoId: string): Promise<void> {
    const hasRun = await runWithVideoProcessingLock(videoId, () => runIfStillQueued(videoId));

    if (hasRun === false) {
        logger.info({ videoId }, "Video already processing in another worker");
    }
}
