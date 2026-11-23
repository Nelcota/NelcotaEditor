import { stat } from "node:fs/promises";
import { toOverallPercent } from "#/modules/processing/processing-stages";
import { MAX_UPLOAD_BYTES } from "#/modules/video-records/upload-limits";
import { MAX_VIDEO_DURATION_SECONDS } from "#/modules/video-records/video-status";
import { runWithProgress } from "#/shared/server/run-with-progress.server";
import { downloadYoutubeVideo } from "#/modules/processing/server/download-youtube-video.server";
import {
    renameVideo,
    saveVideoSource,
    updateVideoStage,
} from "#/modules/video-records/server/video-progress.server";
import { ensureVideoThumbnail } from "#/modules/processing/server/video-thumbnail.server";
import { saveDownloadedSource } from "#/modules/processing/server/save-downloaded-source.server";
import { removeDownloadFiles } from "#/modules/processing/server/download-files.server";
import { toStoredVideoTitle } from "#/modules/video-records/video-title";
import type { Video } from "#/modules/video-records/videos.schema";
import { probeMedia } from "#/shared/server/media-probe.server";
import type { MediaInfo } from "#/shared/server/media-probe.server";
import { getVideoDirectory, resolveStoragePath } from "#/shared/server/storage.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const UNREADABLE_FILE_MESSAGE =
    "Não foi possível ler este arquivo. Exporte o vídeo de novo em MP4 e envie outra vez.";

export interface VideoSource {
    sourcePath: string;
    durationSeconds: number;
}

function removeVideoDownloadFiles(videoId: string): Promise<void> {
    return removeDownloadFiles(resolveStoragePath(getVideoDirectory(videoId)));
}

async function downloadSource(video: Video, signal: AbortSignal): Promise<string> {
    const saveProgress = (downloadPercent: number): Promise<void> =>
        updateVideoStage(video.id, "downloading", toOverallPercent("downloading", downloadPercent));

    await saveProgress(0);
    const downloaded = await runWithProgress(
        (onProgress) => downloadYoutubeVideo(video, { signal, onProgress }),
        saveProgress,
    );

    const title = toStoredVideoTitle(downloaded.title);

    if (title !== null) {
        await renameVideo(video.id, title);
    }

    return downloaded.sourcePath;
}

/** A cancelled or failed download leaves partial files behind; they go with it. */
async function downloadSourceOrClean(video: Video, signal: AbortSignal): Promise<string> {
    // Parts of a run the worker never finished (a crash, a restart) would sit next to this one.
    await removeVideoDownloadFiles(video.id);

    try {
        return await downloadSource(video, signal);
    } catch (error) {
        await removeVideoDownloadFiles(video.id);
        throw error;
    }
}

/** ffprobe fails on damaged or unusual files; the person can fix that by exporting again. */
async function probeSourceMedia(absolutePath: string): Promise<MediaInfo> {
    try {
        return await probeMedia(absolutePath);
    } catch (error) {
        throw new UserFacingError(UNREADABLE_FILE_MESSAGE, { cause: error });
    }
}

interface CheckedSource extends VideoSource {
    sourceBytes: number;
}

/** Refuses files the pipeline cannot use and reads what is saved with the path. */
async function inspectSource(sourcePath: string): Promise<CheckedSource> {
    const absoluteSourcePath = resolveStoragePath(sourcePath);
    const mediaInfo = await probeSourceMedia(absoluteSourcePath);

    if (mediaInfo.hasVideo === false) {
        throw new UserFacingError(
            "O arquivo enviado não tem imagem de vídeo. Escolha um arquivo de vídeo.",
        );
    }

    if (mediaInfo.hasAudio === false) {
        throw new UserFacingError("O vídeo não tem áudio, então não dá para gerar legendas.");
    }

    const durationSeconds = mediaInfo.durationSeconds;

    // ffprobe reports "N/A" for streams it cannot time, which becomes NaN.
    if (Number.isFinite(durationSeconds) === false || durationSeconds <= 0) {
        throw new UserFacingError(UNREADABLE_FILE_MESSAGE);
    }

    if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
        throw new UserFacingError(
            "O vídeo passa de 3 horas. Corte o vídeo ou envie um trecho menor.",
        );
    }

    // yt-dlp limits each format to 4 GB, but video and audio are merged after that check:
    // the same 5 GB ceiling as uploads is enforced on the final file, whatever its origin.
    const fileStats = await stat(absoluteSourcePath);

    if (fileStats.size > MAX_UPLOAD_BYTES) {
        throw new UserFacingError("O vídeo passa de 5 GB. Envie um arquivo menor.");
    }

    return { sourcePath, durationSeconds, sourceBytes: fileStats.size };
}

/** An upload, or a download a previous run already saved. */
async function prepareStoredSource(video: Video, sourcePath: string): Promise<VideoSource> {
    const checkedSource = await inspectSource(sourcePath);
    const source = { sourcePath, durationSeconds: checkedSource.durationSeconds };
    await saveVideoSource(video.id, source);
    return source;
}

/**
 * A download's size is unknown until it ends, so only here can it be checked against the quota.
 * Any refusal deletes the download, since no row points at it.
 */
async function prepareDownloadedSource(video: Video, signal: AbortSignal): Promise<VideoSource> {
    const sourcePath = await downloadSourceOrClean(video, signal);

    try {
        const checkedSource = await inspectSource(sourcePath);
        await saveDownloadedSource({ videoId: video.id, userId: video.userId, ...checkedSource });
        return { sourcePath, durationSeconds: checkedSource.durationSeconds };
    } catch (error) {
        await removeVideoDownloadFiles(video.id);
        throw error;
    }
}

async function obtainSource(video: Video, signal: AbortSignal): Promise<VideoSource> {
    const storedSourcePath = video.sourcePath;

    if (storedSourcePath !== null) {
        return prepareStoredSource(video, storedSourcePath);
    }

    return prepareDownloadedSource(video, signal);
}

/** Makes sure the source file exists locally and reads its duration. Safe to run again. */
export async function prepareVideoSource(video: Video, signal: AbortSignal): Promise<VideoSource> {
    const source = await obtainSource(video, signal);
    await ensureVideoThumbnail({ video, ...source });
    return source;
}
