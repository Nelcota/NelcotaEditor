import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import type { VideoStatus } from "#/modules/videos/video-status";
import { videos } from "#/modules/videos/videos.schema";
import type { Video } from "#/modules/videos/videos.schema";

const MIN_PERCENT = 0;
const MAX_PERCENT = 100;

export class InvalidVideoProgressError extends Error {
    constructor(videoId: string, field: string, value: number) {
        super(`Invalid ${field} for video ${videoId}: ${String(value)}`);
        this.name = "InvalidVideoProgressError";
    }
}

export async function findVideoById(videoId: string): Promise<Video | null> {
    const rows = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
    const video = rows[0];

    if (video === undefined) {
        return null;
    }

    return video;
}

export async function updateVideoStage(
    videoId: string,
    status: VideoStatus,
    progressPercent: number,
): Promise<void> {
    if (Number.isFinite(progressPercent) === false) {
        throw new InvalidVideoProgressError(videoId, "progress percent", progressPercent);
    }

    const boundedPercent = Math.round(
        Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, progressPercent)),
    );

    await db
        .update(videos)
        .set({ status, progressPercent: boundedPercent, errorMessage: null })
        .where(eq(videos.id, videoId));
}

export async function isCancelRequested(videoId: string): Promise<boolean> {
    const rows = await db
        .select({ cancelRequested: videos.cancelRequested })
        .from(videos)
        .where(eq(videos.id, videoId))
        .limit(1);
    const row = rows[0];

    if (row === undefined) {
        // A deleted video is as good as cancelled.
        return true;
    }

    return row.cancelRequested;
}

export async function markVideoCancelled(videoId: string): Promise<void> {
    await db
        .update(videos)
        .set({
            status: "cancelled",
            cancelRequested: false,
            errorMessage: null,
            finishedAt: new Date(),
        })
        .where(eq(videos.id, videoId));
}

export async function markVideoFailed(videoId: string, errorMessage: string): Promise<void> {
    await db
        .update(videos)
        .set({ status: "failed", errorMessage, cancelRequested: false, finishedAt: new Date() })
        .where(eq(videos.id, videoId));
}

export async function markVideoDone(videoId: string): Promise<void> {
    await db
        .update(videos)
        .set({
            status: "done",
            progressPercent: MAX_PERCENT,
            errorMessage: null,
            cancelRequested: false,
            finishedAt: new Date(),
        })
        .where(eq(videos.id, videoId));
}

/** Puts a finished video back at the start of the queue; the caller enqueues the job. */
export async function resetVideoToQueued(videoId: string): Promise<void> {
    await db
        .update(videos)
        .set({
            status: "queued",
            errorMessage: null,
            progressPercent: MIN_PERCENT,
            cancelRequested: false,
            finishedAt: null,
        })
        .where(eq(videos.id, videoId));
}

export async function saveVideoSource(
    videoId: string,
    source: { sourcePath: string; durationSeconds: number },
): Promise<void> {
    const durationSeconds = source.durationSeconds;

    if (Number.isFinite(durationSeconds) === false || durationSeconds <= 0) {
        throw new InvalidVideoProgressError(videoId, "duration", durationSeconds);
    }

    await db
        .update(videos)
        .set({ sourcePath: source.sourcePath, durationSeconds })
        .where(eq(videos.id, videoId));
}

export async function renameVideo(videoId: string, title: string): Promise<void> {
    await db.update(videos).set({ title }).where(eq(videos.id, videoId));
}
