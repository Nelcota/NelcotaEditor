import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import type { Video } from "#/modules/video-records/video-records.schema";
import { videos } from "#/modules/video-records/video-records.schema";
import { localFileInput } from "#/shared/server/local-media-input.server";
import { runCommand } from "#/shared/server/run-command.server";
import { getVideoDirectory, resolveStoragePath } from "#/shared/server/storage.server";
import { logger } from "#/shared/server/logger.server";

const THUMBNAIL_FILE_NAME = "thumbnail.jpg";
const THUMBNAIL_WIDTH = 640;
// 10% in skips black intros; capped so long videos do not seek far for one frame.
const THUMBNAIL_POSITION_RATIO = 0.1;
const MAX_THUMBNAIL_SECONDS = 60;
const JPEG_QUALITY = "4";

function pickThumbnailSecond(durationSeconds: number): number {
    if (Number.isFinite(durationSeconds) === false || durationSeconds <= 0) {
        return 0;
    }

    return Math.min(durationSeconds * THUMBNAIL_POSITION_RATIO, MAX_THUMBNAIL_SECONDS);
}

interface ThumbnailSource {
    video: Video;
    sourcePath: string;
    durationSeconds: number;
}

/**
 * Saves one frame as the video's thumbnail, once. A thumbnail is a nice-to-have, so a failure is
 * logged and the pipeline goes on; the screen falls back to the mascot.
 */
export async function ensureVideoThumbnail(input: ThumbnailSource): Promise<void> {
    const { video, sourcePath, durationSeconds } = input;

    if (video.thumbnailPath !== null) {
        return;
    }

    const thumbnailPath = path.posix.join(getVideoDirectory(video.id), THUMBNAIL_FILE_NAME);

    try {
        await runCommand("ffmpeg", [
            "-y",
            "-ss",
            pickThumbnailSecond(durationSeconds).toFixed(2),
            ...localFileInput(resolveStoragePath(sourcePath)),
            "-frames:v",
            "1",
            "-vf",
            `scale=${THUMBNAIL_WIDTH}:-2`,
            "-q:v",
            JPEG_QUALITY,
            resolveStoragePath(thumbnailPath),
        ]);
        await db.update(videos).set({ thumbnailPath }).where(eq(videos.id, video.id));
    } catch (error) {
        logger.warn("Could not create the video thumbnail", { videoId: video.id, error });
    }
}
