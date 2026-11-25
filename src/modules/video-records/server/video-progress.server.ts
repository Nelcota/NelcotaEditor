import { and, eq, inArray, isNull, sql } from "drizzle-orm";
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
// A video's first run starts as it is created; a retry or a Studio render starts later.
const FIRST_RUN_START_WINDOW = sql`interval '1 minute'`;

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
    run: VideoRun,
    status: VideoStatus,
    progressPercent: number,
): Promise<void> {
    const videoId = run.videoId;

    if (Number.isFinite(progressPercent) === false) {
        throw new InvalidVideoProgressError(videoId, "progress percent", progressPercent);
    }

    const boundedPercent = Math.round(
        Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, progressPercent)),
    );

    // A late progress update must not bring back a video that was cancelled or finished meanwhile,
    // nor move a video that a newer run took.
    await db
        .update(videos)
        .set({ status, progressPercent: boundedPercent, errorMessage: null })
        .where(and(eq(videos.id, videoId), isCurrentRun(run), canMoveVideoTo(status)));
}

/**
 * One run of the pipeline over a video. A retry or a Studio render starts a new run with a new
 * processingStartedAt, so a run that outlived its turn (a cancel while it was still starting, then
 * a retry) can tell, and its late writes never touch the new run's video.
 */
export interface VideoRun {
    videoId: string;
    processingStartedAt: Date | null;
}

export function toVideoRun(video: Pick<Video, "id" | "processingStartedAt">): VideoRun {
    return { videoId: video.id, processingStartedAt: video.processingStartedAt };
}

function isSameRunStart(storedStart: Date | null, runStart: Date | null): boolean {
    if (storedStart === null || runStart === null) {
        return storedStart === runStart;
    }

    return storedStart.getTime() === runStart.getTime();
}

/** The WHERE condition that keeps a write to the run that read the video. */
function isCurrentRun(run: VideoRun): SQL {
    const runStart = run.processingStartedAt;

    if (runStart === null) {
        return isNull(videos.processingStartedAt);
    }

    // Truncated like the JavaScript Date the run read, which keeps only milliseconds.
    return sql`date_trunc('milliseconds', ${videos.processingStartedAt}) = ${sql.param(runStart, videos.processingStartedAt)}`;
}

/** Whether the run must stop: the user asked to cancel, deleted the video, or a new run took it. */
export async function shouldStopVideoRun(run: VideoRun): Promise<boolean> {
    const rows = await db
        .select({
            cancelRequested: videos.cancelRequested,
            processingStartedAt: videos.processingStartedAt,
        })
        .from(videos)
        .where(eq(videos.id, run.videoId))
        .limit(1);
    const row = rows[0];

    if (row === undefined) {
        // A deleted video is as good as cancelled.
        return true;
    }

    if (row.cancelRequested === true) {
        return true;
    }

    return isSameRunStart(row.processingStartedAt, run.processingStartedAt) === false;
}

/**
 * Only a cancel the user asked for, and only for the run it was asked of: a run that stops late
 * must not cancel a video the user retried in the meantime.
 */
export async function markVideoCancelled(run: VideoRun): Promise<void> {
    await db
        .update(videos)
        .set({
            status: "cancelled",
            cancelRequested: false,
            errorMessage: null,
            finishedAt: new Date(),
        })
        .where(
            and(
                eq(videos.id, run.videoId),
                eq(videos.cancelRequested, true),
                isCurrentRun(run),
                canMoveVideoTo("cancelled"),
            ),
        );
}

export async function markVideoFailed(run: VideoRun, errorMessage: string): Promise<void> {
    await db
        .update(videos)
        .set({ status: "failed", errorMessage, cancelRequested: false, finishedAt: new Date() })
        .where(and(eq(videos.id, run.videoId), isCurrentRun(run), canMoveVideoTo("failed")));
}

/**
 * Returns false when the video was not marked done: it was cancelled, deleted, taken by a newer
 * run, or the user asked to cancel right as the last step ended. The caller then records the
 * cancel, which only applies in that last case.
 */
export async function markVideoDone(run: VideoRun): Promise<boolean> {
    const finishedAt = new Date();
    const doneRows = await db
        .update(videos)
        .set({
            status: "done",
            progressPercent: MAX_PERCENT,
            errorMessage: null,
            cancelRequested: false,
            finishedAt,
            // Only the first run: a later retry or Studio render must not move it. A run that did not
            // start with the video is not the first one (a video from before this column, or one
            // whose first run failed), so it stays out, as in the backfill of migration 0016.
            firstFinishedAt: sql`coalesce(${videos.firstFinishedAt}, case when ${videos.processingStartedAt} < ${videos.createdAt} + ${FIRST_RUN_START_WINDOW} then ${finishedAt.toISOString()}::timestamptz end)`,
        })
        .where(
            and(
                eq(videos.id, run.videoId),
                eq(videos.cancelRequested, false),
                isCurrentRun(run),
                canMoveVideoTo("done"),
            ),
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
