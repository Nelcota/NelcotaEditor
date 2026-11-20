import { toOverallPercent } from "#/modules/processing/processing-stages";
import { MAX_VIDEO_DURATION_SECONDS } from "#/modules/videos/video-status";
import { runWithProgress } from "#/shared/server/run-with-progress.server";
import { downloadYoutubeVideo } from "#/modules/videos/server/download-youtube-video.server";
import {
    renameVideo,
    saveVideoSource,
    updateVideoStage,
} from "#/modules/videos/server/video-progress.server";
import { ensureVideoThumbnail } from "#/modules/videos/server/video-thumbnail.server";
import type { Video } from "#/modules/videos/videos.schema";
import { probeMedia } from "#/shared/server/media-probe.server";
import { resolveStoragePath } from "#/shared/server/storage.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

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

    if (downloaded.title.length > 0) {
        await renameVideo(video.id, downloaded.title);
    }

    return downloaded.sourcePath;
}

/** Makes sure the source file exists locally and reads its duration. Safe to run again. */
export async function prepareVideoSource(video: Video, signal: AbortSignal): Promise<VideoSource> {
    const sourcePath = await obtainSourcePath(video, signal);
    const mediaInfo = await probeMedia(resolveStoragePath(sourcePath));

    if (mediaInfo.hasVideo === false) {
        throw new UserFacingError("O arquivo enviado não tem imagem de vídeo.");
    }

    if (mediaInfo.hasAudio === false) {
        throw new UserFacingError("O vídeo não tem áudio, então não dá para gerar legendas.");
    }

    const durationSeconds = mediaInfo.durationSeconds;

    // ffprobe reports "N/A" for streams it cannot time, which becomes NaN.
    if (Number.isFinite(durationSeconds) === false || durationSeconds <= 0) {
        throw new UserFacingError("Não foi possível ler a duração do vídeo.");
    }

    if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
        throw new UserFacingError("O vídeo é longo demais. O máximo é 3 horas.");
    }

    const source = { sourcePath, durationSeconds };
    await saveVideoSource(video.id, source);
    await ensureVideoThumbnail({ video, ...source });
    return source;
}
