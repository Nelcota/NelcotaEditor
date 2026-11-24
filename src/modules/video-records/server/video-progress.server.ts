import { and, eq, inArray } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "#/db/database.server";
import {
    FINISHED_VIDEO_STATUSES,
    WORKING_VIDEO_STATUSES,
} from "#/modules/video-records/model/video-status";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { videos } from "#/modules/video-records/video-records.schema";
import type { Video } from "#/modules/video-records/video-records.schema";

/** The database or an open transaction, so a caller can reset the video with its other updates. */
type DatabaseExecutor = Pick<typeof db, "update">;

/** Statuses of a video the worker still owns: waiting in the queue or being processed. */
const ACTIVE_VIDEO_STATUSES: ReadonlyArray<VideoStatus> = ["queued", ...WORKING_VIDEO_STATUSES];

/**
 * The video state machine: the statuses a video may be in for each status it moves to. Every
 * status UPDATE puts this in its WHERE, so a late write (a stage, done, failed) never overwrites
 * a cancel or a finish that won the race, and a finished video only leaves through the queue.
 */
export const ALLOWED_PREVIOUS_STATUSES: Readonly<Record<VideoStatus, ReadonlyArray<VideoStatus>>> =
    {
        queued: FINISHED_VIDEO_STATUSES,
        downloading: ACTIVE_VIDEO_STATUSES,
        transcribing: ACTIVE_VIDEO_STATUSES,
        selecting: ACTIVE_VIDEO_STATUSES,
        rendering: ACTIVE_VIDEO_STATUSES,
        done: ACTIVE_VIDEO_STATUSES,
        failed: ACTIVE_VIDEO_STATUSES,
        cancelled: ACTIVE_VIDEO_STATUSES,
    };

/** The WHERE condition that lets a video move to the given status. */
export function canMoveVideoTo(nextStatus: VideoStatus): SQL {
    return inArray(videos.status, [...ALLOWED_PREVIOUS_STATUSES[nextStatus]]);
}

/** Shown when a retry finds the video already back in the queue (another tab, a double click). */
export const VIDEO_ALREADY_PROCESSING_MESSAGE = "Este vídeo já está sendo processado.";

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

    // A late progress update must not bring back a video that was cancelled or finished meanwhile.
    await db
        .update(videos)
        .set({ status, progressPercent: boundedPercent, errorMessage: null })
        .where(and(eq(videos.id, videoId), canMoveVideoTo(status)));
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
        .where(and(eq(videos.id, videoId), canMoveVideoTo("cancelled")));
}

export async function markVideoFailed(videoId: string, errorMessage: string): Promise<void> {
    await db
        .update(videos)
        .set({ status: "failed", errorMessage, cancelRequested: false, finishedAt: new Date() })
        .where(and(eq(videos.id, videoId), canMoveVideoTo("failed")));
}

/**
 * Returns false when the video was not marked done: it was cancelled, deleted, or the user asked to
 * cancel right as the last step ended. The caller then records the cancel instead.
 */
export async function markVideoDone(videoId: string): Promise<boolean> {
    const doneRows = await db
        .update(videos)
        .set({
            status: "done",
            progressPercent: MAX_PERCENT,
            errorMessage: null,
            cancelRequested: false,
            finishedAt: new Date(),
        })
        .where(
            and(eq(videos.id, videoId), eq(videos.cancelRequested, false), canMoveVideoTo("done")),
        )
        .returning({ id: videos.id });

    return doneRows.length > 0;
}

/**
 * Puts a finished video back at the start of the queue; the caller enqueues the job only when this
 * returns true. The status is checked in the same statement, so two retries never both win.
 */
export async function resetVideoToQueued(
    videoId: string,
    executor: DatabaseExecutor = db,
): Promise<boolean> {
    const resetRows = await executor
        .update(videos)
        .set({
            status: "queued",
            errorMessage: null,
            progressPercent: MIN_PERCENT,
            cancelRequested: false,
            finishedAt: null,
            processingStartedAt: new Date(),
        })
        .where(and(eq(videos.id, videoId), canMoveVideoTo("queued")))
        .returning({ id: videos.id });

    return resetRows.length > 0;
}

export async function saveVideoSource(
    videoId: string,
    source: { sourcePath: string; sourceBytes: number; durationSeconds: number },
): Promise<void> {
    const { sourcePath, sourceBytes, durationSeconds } = source;

    if (Number.isFinite(durationSeconds) === false || durationSeconds <= 0) {
        throw new InvalidVideoProgressError(videoId, "duration", durationSeconds);
    }

    if (Number.isSafeInteger(sourceBytes) === false || sourceBytes <= 0) {
        throw new InvalidVideoProgressError(videoId, "size", sourceBytes);
    }

    // Stored with the path, so the usage screen and the quota sum the database, not the disk.
    await db
        .update(videos)
        .set({ sourcePath, sourceBytes, durationSeconds })
        .where(eq(videos.id, videoId));
}

export async function renameVideo(videoId: string, title: string): Promise<void> {
    await db.update(videos).set({ title }).where(eq(videos.id, videoId));
}
