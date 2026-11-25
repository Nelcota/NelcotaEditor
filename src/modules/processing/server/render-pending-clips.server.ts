import {
    recordRenderedClip,
    renderClip,
    setClipStatus,
} from "#/modules/clips/server/render-clip.server";
import type { LocalClipFile } from "#/modules/clips/server/render-clip.server";
import type { Clip } from "#/modules/clips/clips.schema";
import { toOverallPercent } from "#/modules/processing/model/processing-stages";
import { runLanesToTheEnd } from "#/modules/processing/server/run-lanes-to-the-end.server";
import { storeProcessedVideoFile } from "#/modules/processing/server/store-processed-video-file.server";
import { runVideoStorageTransaction } from "#/modules/processing/server/video-storage-transaction.server";
import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { updateVideoStage } from "#/modules/video-records/server/video-progress.server";
import type { VideoRun } from "#/modules/video-records/server/video-progress.server";
import { StorageQuotaExceededError } from "#/modules/videos/model/storage-quota-exceeded-error";
import { getClipRenderCapacity } from "#/shared/server/clip-render-capacity.server";
import { getEnvironment } from "#/shared/server/env.server";
import { runWithProgress } from "#/shared/server/run-with-progress.server";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
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

interface StoredPoster {
    posterPath: string;
    posterBytes: number;
}

/** A poster that cannot be stored only costs the link preview its image, like a failed frame. */
async function storePoster(
    clip: Clip,
    poster: LocalClipFile | null,
    signal: AbortSignal,
): Promise<StoredPoster | null> {
    if (poster === null) {
        return null;
    }

    try {
        const storage = getFileStorage();
        const posterBytes = await storage.storeLocalFile(poster.storagePath, poster.localPath, {
            signal,
        });
        return { posterPath: poster.storagePath, posterBytes };
    } catch (error) {
        if (signal.aborted === true) {
            throw error;
        }

        logger.warn({ clipId: clip.id, error }, "Could not store the clip poster");
        return null;
    }
}

interface StoredClipFiles {
    video: LocalClipFile;
    poster: StoredPoster | null;
    encodeDurationMs: number;
}

interface ClipToRecord {
    clip: Clip;
    userId: string;
    outputPath: string;
    videoBytes: number;
    signal: AbortSignal;
}

function recordClipFiles(output: ClipToRecord, poster: StoredPoster | null): Promise<void> {
    const { clip, userId, outputPath, videoBytes, signal } = output;
    const outputBytes = videoBytes + (poster?.posterBytes ?? 0);
    const posterPath = poster?.posterPath ?? null;
    const replacedBytes = clip.outputBytes ?? 0;

    signal.throwIfAborted();
    return runVideoStorageTransaction(
        { userId, byteDelta: outputBytes - replacedBytes },
        (transaction) =>
            recordRenderedClip(clip.id, { outputPath, outputBytes, posterPath }, transaction),
    );
}

async function recordWithOptionalPoster(
    output: ClipToRecord,
    poster: StoredPoster | null,
): Promise<StoredPoster | null> {
    try {
        await recordClipFiles(output, poster);
        return poster;
    } catch (error) {
        if (poster === null || error instanceof StorageQuotaExceededError === false) {
            throw error;
        }
    }

    // A preview image should never make a video that fits fail the quota check.
    await recordClipFiles(output, null);
    return null;
}

async function removeUnrecordedPoster(clipId: string, poster: StoredPoster | null): Promise<void> {
    if (poster === null) {
        return;
    }

    try {
        await getFileStorage().deleteFile(poster.posterPath);
    } catch (error) {
        logger.warn({ clipId, error }, "Could not remove the unrecorded clip poster");
    }
}

async function storeVideoAndRecord(
    clip: Clip,
    input: RenderPendingClipsInput,
    files: StoredClipFiles,
): Promise<void> {
    const { userId, signal } = input;
    const { video, poster, encodeDurationMs } = files;
    const outputPath = video.storagePath;
    let recordedPoster = poster;

    const { bytes: videoBytes, storageDurationMs } = await storeProcessedVideoFile(
        { key: outputPath, localPath: video.localPath, signal },
        async (storedVideoBytes) => {
            recordedPoster = await recordWithOptionalPoster(
                { clip, userId, outputPath, videoBytes: storedVideoBytes, signal },
                poster,
            );
        },
    );

    if (recordedPoster === null) {
        await removeUnrecordedPoster(clip.id, poster);
    }

    const { STORAGE_DRIVER: storageDriver } = getEnvironment();
    logger.info(
        {
            clipId: clip.id,
            encodeDurationMs,
            storageDurationMs,
            storageDriver,
            outputBytes: videoBytes + (recordedPoster?.posterBytes ?? 0),
        },
        "Clip rendered and stored",
    );
}

async function renderAndStoreClip(clip: Clip, input: RenderPendingClipsInput): Promise<void> {
    const { localSourcePath, workDirectory, words, signal } = input;
    const rendered = await renderClip({ clip, localSourcePath, workDirectory, words, signal });
    const poster = await storePoster(clip, rendered.poster, signal);

    try {
        await storeVideoAndRecord(clip, input, {
            video: rendered.video,
            poster,
            encodeDurationMs: rendered.encodeDurationMs,
        });
    } catch (error) {
        // The clip has no row pointing at the poster, so nothing else would ever remove it.
        await removeUnrecordedPoster(clip.id, poster);
        throw error;
    }
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
    // Keep an extra clip in flight so storage writes can overlap the next encode.
    const lanes = getClipRenderCapacity().concurrency + 1;
    let readyCount = input.clips.filter((clip) => clip.status === "done").length;
    let finishedCount = 0;

    await runLanesToTheEnd(clips, lanes, async (clip): Promise<void> => {
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
