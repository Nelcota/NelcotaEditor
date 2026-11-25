import {
    recordRenderedClip,
    renderClip,
    setClipStatus,
} from "#/modules/clips/server/render-clip.server";
import type { Clip } from "#/modules/clips/clips.schema";
import { toOverallPercent } from "#/modules/processing/model/processing-stages";
import { runLanesToTheEnd } from "#/modules/processing/server/run-lanes-to-the-end.server";
import { storeProcessedVideoFile } from "#/modules/processing/server/store-processed-video-file.server";
import { runVideoStorageTransaction } from "#/modules/processing/server/video-storage-transaction.server";
import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { updateVideoStage } from "#/modules/video-records/server/video-progress.server";
import type { VideoRun } from "#/modules/video-records/server/video-progress.server";
import { getEnvironment } from "#/shared/server/env.server";
import { runWithProgress } from "#/shared/server/run-with-progress.server";
import { UserFacingError } from "#/shared/server/user-facing-error";
import { logger } from "#/shared/server/logger.server";

const PERCENT = 100;

interface RenderPendingClipsInput {
    run: VideoRun;
    userId: string;
    /** A local copy of the source that ffmpeg can read. */
    localSourcePath: string;
    /** The run's folder; renders are written here before they are stored. */
    workDirectory: string;
    clips: Array<Clip>;
    words: Array<TranscriptWord>;
    signal: AbortSignal;
}

async function renderAndStoreClip(clip: Clip, input: RenderPendingClipsInput): Promise<void> {
    const { userId, localSourcePath, workDirectory, words, signal } = input;
    const { id: clipId, outputBytes: previousOutputBytes } = clip;
    const { outputPath, localPath, encodeDurationMs } = await renderClip({
        clip,
        localSourcePath,
        workDirectory,
        words,
        signal,
    });
    const replacedBytes = previousOutputBytes ?? 0;
    const { STORAGE_DRIVER: storageDriver } = getEnvironment();
    const { bytes: outputBytes, storageDurationMs } = await storeProcessedVideoFile(
        { key: outputPath, localPath, signal },
        (bytes) =>
            runVideoStorageTransaction(
                { userId, byteDelta: bytes - replacedBytes },
                (transaction) =>
                    recordRenderedClip(clipId, { outputPath, outputBytes: bytes }, transaction),
            ),
    );
    logger.info(
        { clipId, encodeDurationMs, storageDurationMs, storageDriver, outputBytes },
        "Clip rendered and stored",
    );
}

/** Returns whether the clip ended up rendered. */
async function renderOneClip(clip: Clip, input: RenderPendingClipsInput): Promise<boolean> {
    const { run, signal } = input;
    const videoId = run.videoId;

    signal.throwIfAborted();

    try {
        await setClipStatus(clip.id, "rendering");
        await renderAndStoreClip(clip, input);
        return true;
    } catch (error) {
        if (signal.aborted === true) {
            // Cancelled: the clip goes back to the queue for when the user resumes.
            await setClipStatus(clip.id, "pending");
            throw error;
        }

        // One broken clip should not throw away the others; it is marked as failed instead.
        logger.error({ clipId: clip.id, videoId, error }, "Failed to render clip");
        await setClipStatus(clip.id, "failed");
        return false;
    }
}

async function renderAll(
    input: RenderPendingClipsInput,
    onProgress: (percent: number) => void,
): Promise<number> {
    const clips = input.clips.filter((clip) => clip.status === "pending");
    const { processingStartedAt } = input.run;
    const { CLIP_RENDER_CONCURRENCY: concurrency } = getEnvironment();
    let readyCount = input.clips.filter((clip) => clip.status === "done").length;
    let finishedCount = 0;

    await runLanesToTheEnd(clips, concurrency, async (clip): Promise<void> => {
        const isRendered = await renderOneClip(clip, input);
        finishedCount += 1;
        onProgress((finishedCount / clips.length) * PERCENT);

        if (isRendered === false) {
            return;
        }

        readyCount += 1;

        if (readyCount === 1 && processingStartedAt !== null) {
            const timeToFirstClipMs = Math.max(0, Date.now() - processingStartedAt.getTime());
            logger.info({ clipId: clip.id, timeToFirstClipMs }, "First clip ready");
        }
    });

    return readyCount;
}

/** Renders the pending clips selected for this run and keeps previously completed outputs. */
export async function renderPendingClips(input: RenderPendingClipsInput): Promise<void> {
    const { run, clips } = input;

    // Also keeps renderAll from dividing by zero when it reports progress.
    if (clips.length === 0) {
        throw new UserFacingError("Nenhum corte foi gerado.");
    }

    const saveProgress = (stagePercent: number): Promise<void> =>
        updateVideoStage(run, "rendering", toOverallPercent("rendering", stagePercent));

    await saveProgress(0);
    const renderedCount = await runWithProgress(
        (onProgress) => renderAll(input, onProgress),
        saveProgress,
    );

    if (renderedCount === 0) {
        throw new UserFacingError("Não foi possível renderizar os cortes. Tente novamente.");
    }
}
