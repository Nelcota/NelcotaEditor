import { rm, stat } from "node:fs/promises";
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
import { toStoredVideoTitle } from "#/modules/video-records/video-title";
import type { Video } from "#/modules/video-records/videos.schema";
import { probeMedia } from "#/shared/server/media-probe.server";
import type { MediaInfo } from "#/shared/server/media-probe.server";
import { resolveStoragePath } from "#/shared/server/storage.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const UNREADABLE_FILE_MESSAGE =
    "Não foi possível ler este arquivo. Exporte o vídeo de novo em MP4 e envie outra vez.";

export interface VideoSource {
    sourcePath: string;
    durationSeconds: number;
}

async function obtainSourcePath(video: Video, signal: AbortSignal): Promise<string> {
    if (video.sourcePath !== null) {
        return video.sourcePath;
    }

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

/** ffprobe fails on damaged or unusual files; the person can fix that by exporting again. */
async function probeSourceMedia(absolutePath: string): Promise<MediaInfo> {
    try {
        return await probeMedia(absolutePath);
    } catch (error) {
        throw new UserFacingError(UNREADABLE_FILE_MESSAGE, { cause: error });
    }
}

/** Makes sure the source file exists locally and reads its duration. Safe to run again. */
export async function prepareVideoSource(video: Video, signal: AbortSignal): Promise<VideoSource> {
    const sourcePath = await obtainSourcePath(video, signal);
    const mediaInfo = await probeSourceMedia(resolveStoragePath(sourcePath));

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
    const absoluteSourcePath = resolveStoragePath(sourcePath);
    const fileStats = await stat(absoluteSourcePath);

    if (fileStats.size > MAX_UPLOAD_BYTES) {
        // A download that is never saved would otherwise sit on disk and count against the quota.
        if (video.sourcePath === null) {
            await rm(absoluteSourcePath, { force: true });
        }

        throw new UserFacingError("O vídeo passa de 5 GB. Envie um arquivo menor.");
    }

    const source = { sourcePath, durationSeconds };
    await saveVideoSource(video.id, source);
    await ensureVideoThumbnail({ video, ...source });
    return source;
}
