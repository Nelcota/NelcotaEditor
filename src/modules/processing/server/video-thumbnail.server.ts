import path from "node:path";
import { eq } from "drizzle-orm";
import { storeProcessedVideoFile } from "#/modules/processing/server/store-processed-video-file.server";
import { runVideoStorageTransaction } from "#/modules/processing/server/video-storage-transaction.server";
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
    sourceBytes: number;
    durationSeconds: number;
    /** The run's folder; the frame is written here and then stored. */
    workDirectory: string;
    signal: AbortSignal;
}

interface StoredThumbnail {
    thumbnailPath: string;
    thumbnailBytes: number;
}

async function recordThumbnail(input: ThumbnailSource, thumbnail: StoredThumbnail): Promise<void> {
    const { video, sourceBytes } = input;
    const { thumbnailPath, thumbnailBytes } = thumbnail;
    const totalBytes = sourceBytes + thumbnailBytes;
    const previousBytes = Math.max(sourceBytes, video.sourceBytes ?? 0);

    await runVideoStorageTransaction(
        { userId: video.userId, byteDelta: totalBytes - previousBytes },
        async (transaction) => {
            const rows = await transaction
                .update(videos)
                .set({ thumbnailPath, sourceBytes: totalBytes })
                .where(eq(videos.id, video.id))
                .returning({ id: videos.id });

            if (rows.length === 0) {
                throw new Error(`Video ${video.id} disappeared before its thumbnail was recorded`);
            }
        },
    );
}

async function createThumbnail(input: ThumbnailSource): Promise<void> {
    const { video, localSourcePath, durationSeconds, workDirectory, signal } = input;
    const thumbnailPath = path.posix.join(getVideoDirectory(video.id), THUMBNAIL_FILE_NAME);
    const localThumbnailPath = path.join(workDirectory, THUMBNAIL_FILE_NAME);

    await runCommand(
        "ffmpeg",
        [
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
        ],
        { signal },
    );
    await storeProcessedVideoFile(
        { key: thumbnailPath, localPath: localThumbnailPath, signal },
        (thumbnailBytes) => recordThumbnail(input, { thumbnailPath, thumbnailBytes }),
    );
}

async function saveThumbnail(input: ThumbnailSource): Promise<void> {
    const thumbnailPath = input.video.thumbnailPath;

    if (thumbnailPath !== null) {
        const thumbnailBytes = await getFileStorage().measureFile(thumbnailPath);
        await recordThumbnail(input, { thumbnailPath, thumbnailBytes });
        return;
    }

    return createThumbnail(input);
}

/**
 * Saves one frame as the video's thumbnail and counts it with the source.
 * A thumbnail is a nice-to-have, so a failure is logged and the pipeline goes on; the screen
 * falls back to the mascot. Cancellation is not a failure: it stops the run.
 */
export async function ensureVideoThumbnail(input: ThumbnailSource): Promise<void> {
    const videoId = input.video.id;
    const signal = input.signal;

    try {
        await saveThumbnail(input);
    } catch (error) {
        if (signal.aborted === true) {
            throw error;
        }

        logger.warn({ videoId, error }, "Could not create the video thumbnail");
    }
}
