import { stat } from "node:fs/promises";
import path from "node:path";
import { toOverallPercent } from "#/modules/processing/model/processing-stages";
import { MAX_UPLOAD_BYTES } from "#/modules/video-records/model/upload-limits";
import { MAX_VIDEO_DURATION_SECONDS } from "#/modules/video-records/model/video-status";
import { runWithProgress } from "#/shared/server/run-with-progress.server";
import { downloadYoutubeVideo } from "#/modules/processing/server/download-youtube-video.server";
import type { DownloadedVideo } from "#/modules/processing/server/download-youtube-video.server";
import {
    renameVideo,
    saveVideoSource,
    updateVideoStage,
} from "#/modules/video-records/server/video-progress.server";
import { ensureVideoThumbnail } from "#/modules/processing/server/video-thumbnail.server";
import { saveDownloadedSource } from "#/modules/processing/server/save-downloaded-source.server";
import { toStoredVideoTitle } from "#/modules/video-records/model/video-title";
import type { Video } from "#/modules/video-records/video-records.schema";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { probeMedia } from "#/shared/server/media-probe.server";
import type { MediaInfo } from "#/shared/server/media-probe.server";
import { getVideoDirectory } from "#/shared/server/storage.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const UNREADABLE_FILE_MESSAGE =
    "Não foi possível ler este arquivo. Exporte o vídeo de novo em MP4 e envie outra vez.";

export interface VideoSource {
    /** The stored file's key, kept on the video row. */
    sourcePath: string;
    /** A copy ffmpeg can read during this run; it goes with the workspace. */
    localSourcePath: string;
    durationSeconds: number;
}

interface SourceContext {
    signal: AbortSignal;
    /** The run's own empty folder, removed when the run ends. */
    workDirectory: string;
}

async function downloadSource(video: Video, context: SourceContext): Promise<DownloadedVideo> {
    const saveProgress = (downloadPercent: number): Promise<void> =>
        updateVideoStage(video.id, "downloading", toOverallPercent("downloading", downloadPercent));

    await saveProgress(0);
    const downloaded = await runWithProgress(
        (onProgress) =>
            downloadYoutubeVideo(video, {
                outputDirectory: context.workDirectory,
                signal: context.signal,
                onProgress,
            }),
        saveProgress,
    );

    const title = toStoredVideoTitle(downloaded.title);

    if (title !== null) {
        await renameVideo(video.id, title);
    }

    return downloaded;
}

/** ffprobe fails on damaged or unusual files; the person can fix that by exporting again. */
async function probeSourceMedia(localPath: string): Promise<MediaInfo> {
    try {
        return await probeMedia(localPath);
    } catch (error) {
        throw new UserFacingError(UNREADABLE_FILE_MESSAGE, { cause: error });
    }
}

interface CheckedSource {
    durationSeconds: number;
    sourceBytes: number;
}

/** Refuses files the pipeline cannot use and reads what is saved with the path. */
async function inspectSource(localPath: string): Promise<CheckedSource> {
    const mediaInfo = await probeSourceMedia(localPath);

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
    const fileStats = await stat(localPath);

    if (fileStats.size > MAX_UPLOAD_BYTES) {
        throw new UserFacingError("O vídeo passa de 5 GB. Envie um arquivo menor.");
    }

    return { durationSeconds, sourceBytes: fileStats.size };
}

/** An upload, or a download a previous run already saved. */
async function prepareStoredSource(
    video: Video,
    sourcePath: string,
    context: SourceContext,
): Promise<VideoSource> {
    const localSourcePath = await getFileStorage().getLocalFile(sourcePath, context.workDirectory);
    const checkedSource = await inspectSource(localSourcePath);
    await saveVideoSource(video.id, { sourcePath, ...checkedSource });
    return { sourcePath, localSourcePath, durationSeconds: checkedSource.durationSeconds };
}

/** Stored under the video's folder with the name yt-dlp gave it ("source.mp4"). */
function toDownloadedSourcePath(videoId: string, localPath: string): string {
    return path.posix.join(getVideoDirectory(videoId), path.basename(localPath));
}

/**
 * A download's size is unknown until it ends, so only here can it be checked against the quota.
 * A refusal deletes the stored copy, since no row points at it; the local one goes with the
 * workspace.
 */
async function prepareDownloadedSource(video: Video, context: SourceContext): Promise<VideoSource> {
    const downloaded = await downloadSource(video, context);
    const localSourcePath = downloaded.localPath;
    const checkedSource = await inspectSource(localSourcePath);
    const sourcePath = toDownloadedSourcePath(video.id, localSourcePath);
    const storage = getFileStorage();

    await storage.storeLocalFile(sourcePath, localSourcePath);

    try {
        await saveDownloadedSource({
            videoId: video.id,
            userId: video.userId,
            sourcePath,
            ...checkedSource,
        });
    } catch (error) {
        await storage.deleteFile(sourcePath);
        throw error;
    }

    return { sourcePath, localSourcePath, durationSeconds: checkedSource.durationSeconds };
}

async function obtainSource(video: Video, context: SourceContext): Promise<VideoSource> {
    const storedSourcePath = video.sourcePath;

    if (storedSourcePath !== null) {
        return prepareStoredSource(video, storedSourcePath, context);
    }

    return prepareDownloadedSource(video, context);
}

/** Makes sure the source is stored and readable locally, and reads its duration. Safe to run again. */
export async function prepareVideoSource(
    video: Video,
    context: SourceContext,
): Promise<VideoSource> {
    const source = await obtainSource(video, context);
    await ensureVideoThumbnail({
        video,
        localSourcePath: source.localSourcePath,
        durationSeconds: source.durationSeconds,
        workDirectory: context.workDirectory,
    });
    return source;
}
