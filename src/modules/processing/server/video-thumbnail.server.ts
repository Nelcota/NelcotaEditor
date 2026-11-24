import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import type { Video } from "#/modules/video-records/video-records.schema";
import { videos } from "#/modules/video-records/video-records.schema";
import { localFileInput } from "#/shared/server/local-media-input.server";
import { runCommand } from "#/shared/server/run-command.server";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { getVideoDirectory } from "#/shared/server/storage.server";
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
    localSourcePath: string;
    durationSeconds: number;
    /** The run's folder; the frame is written here and then stored. */
    workDirectory: string;
}

/**
 * Saves one frame as the video's thumbnail, once. A thumbnail is a nice-to-have, so a failure is
 * logged and the pipeline goes on; the screen falls back to the mascot.
 */
export async function ensureVideoThumbnail(input: ThumbnailSource): Promise<void> {
    const { video, localSourcePath, durationSeconds, workDirectory } = input;

    if (video.thumbnailPath !== null) {
        return;
    }

    const thumbnailPath = path.posix.join(getVideoDirectory(video.id), THUMBNAIL_FILE_NAME);
    const localThumbnailPath = path.join(workDirectory, THUMBNAIL_FILE_NAME);

    try {
        await runCommand("ffmpeg", [
            "-y",
            "-ss",
            pickThumbnailSecond(durationSeconds).toFixed(2),
            ...localFileInput(localSourcePath),
            "-frames:v",
            "1",
            "-vf",
            `scale=${THUMBNAIL_WIDTH}:-2`,
            "-q:v",
            JPEG_QUALITY,
            localThumbnailPath,
        ]);
        await getFileStorage().storeLocalFile(thumbnailPath, localThumbnailPath);
        await db.update(videos).set({ thumbnailPath }).where(eq(videos.id, video.id));
    } catch (error) {
        logger.warn({ videoId: video.id, error }, "Could not create the video thumbnail");
    }
}
