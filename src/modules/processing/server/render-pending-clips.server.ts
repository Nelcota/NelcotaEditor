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
import { runWithProgress } from "#/shared/server/run-with-progress.server";
import { UserFacingError } from "#/shared/server/user-facing-error";
import { logger } from "#/shared/server/logger.server";

/** Clips rendered at once; ffmpeg already uses several cores, so more lanes stop paying off. */
const RENDER_CONCURRENCY = 2;
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
    const { outputPath, localPath } = await renderClip({
        clip,
        localSourcePath,
        workDirectory,
        words,
        signal,
    });
    const replacedBytes = clip.outputBytes ?? 0;

    await storeProcessedVideoFile({ key: outputPath, localPath, signal }, (outputBytes) =>
        runVideoStorageTransaction(
            { userId, byteDelta: outputBytes - replacedBytes },
            (transaction) => recordRenderedClip(clip.id, { outputPath, outputBytes }, transaction),
        ),
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
    const readyCount = input.clips.filter((clip) => clip.status === "done").length;
    let finishedCount = 0;
    const outcomes = await runLanesToTheEnd(clips, RENDER_CONCURRENCY, async (clip) => {
        const isRendered = await renderOneClip(clip, input);
        finishedCount += 1;
        onProgress((finishedCount / clips.length) * PERCENT);
        return isRendered;
    });

    return readyCount + outcomes.filter((isRendered) => isRendered === true).length;
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
