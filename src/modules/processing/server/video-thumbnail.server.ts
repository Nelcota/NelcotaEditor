import { stat } from "node:fs/promises";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
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
    signal: AbortSignal;
}

interface StoredThumbnail {
    thumbnailPath: string;
    thumbnailBytes: number;
}

/**
 * The source size counts "the original video and its thumbnail", so the quota sees the frame
 * too. Added in place, since the source was just saved with its own size alone.
 */
async function recordThumbnail(videoId: string, thumbnail: StoredThumbnail): Promise<void> {
    const { thumbnailPath, thumbnailBytes } = thumbnail;

    await db
        .update(videos)
        .set({
            thumbnailPath,
            sourceBytes: sql`coalesce(${videos.sourceBytes}, 0) + ${thumbnailBytes}`,
        })
        .where(eq(videos.id, videoId));
}

async function createThumbnail(input: ThumbnailSource): Promise<StoredThumbnail> {
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
    const thumbnailStats = await stat(localThumbnailPath);
    await getFileStorage().storeLocalFile(thumbnailPath, localThumbnailPath, { signal });
    return { thumbnailPath, thumbnailBytes: thumbnailStats.size };
}

/** A frame an earlier run saved; this run has just stored the source size without it. */
async function measureStoredThumbnail(thumbnailPath: string): Promise<StoredThumbnail> {
    const thumbnailBytes = await getFileStorage().measureFile(thumbnailPath);
    return { thumbnailPath, thumbnailBytes };
}

async function obtainThumbnail(input: ThumbnailSource): Promise<StoredThumbnail> {
    const storedThumbnailPath = input.video.thumbnailPath;

    if (storedThumbnailPath !== null) {
        return measureStoredThumbnail(storedThumbnailPath);
    }

    return createThumbnail(input);
}

/**
 * Saves one frame as the video's thumbnail, once, and counts its size. It runs right after every
 * run saves the source with its size alone, so a frame from an earlier run is counted again here.
 * A thumbnail is a nice-to-have, so a failure is logged and the pipeline goes on; the screen
 * falls back to the mascot. Cancellation is not a failure: it stops the run.
 */
export async function ensureVideoThumbnail(input: ThumbnailSource): Promise<void> {
    const videoId = input.video.id;
    const signal = input.signal;

    try {
        const thumbnail = await obtainThumbnail(input);
        await recordThumbnail(videoId, thumbnail);
    } catch (error) {
        if (signal.aborted === true) {
            throw error;
        }

        logger.warn({ videoId, error }, "Could not create the video thumbnail");
    }
}
