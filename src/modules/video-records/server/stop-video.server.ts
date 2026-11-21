import { rm } from "node:fs/promises";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { canMoveVideoTo } from "#/modules/video-records/server/video-progress.server";
import { WORKING_VIDEO_STATUSES } from "#/modules/video-records/video-status";
import { videos } from "#/modules/video-records/videos.schema";
import { getVideoDirectory, resolveStoragePath } from "#/shared/server/storage.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

/**
 * One statement, so a video that finishes in between is never flagged. The flag stops a running
 * worker step; a video still in the queue has none, so it is cancelled at once. The caller checks
 * who may cancel it.
 */
export async function requestVideoCancellation(videoId: string): Promise<void> {
    const isQueued = sql`${videos.status} = 'queued'`;
    const cancelledRows = await db
        .update(videos)
        .set({
            cancelRequested: true,
            status: sql`CASE WHEN ${isQueued} THEN 'cancelled'::video_status ELSE ${videos.status} END`,
            finishedAt: sql`CASE WHEN ${isQueued} THEN ${sql.param(new Date(), videos.finishedAt)} ELSE ${videos.finishedAt} END`,
        })
        .where(and(eq(videos.id, videoId), canMoveVideoTo("cancelled")))
        .returning({ id: videos.id });

    if (cancelledRows.length === 0) {
        throw new UserFacingError("Este vídeo não está sendo processado.");
    }
}

/**
 * Deletes the row and then its files. The status is checked in the same statement, so a worker
 * that starts in between wins. The caller checks who may delete it.
 */
export async function deleteStoppedVideo(videoId: string): Promise<void> {
    const deletedRows = await db
        .delete(videos)
        .where(and(eq(videos.id, videoId), notInArray(videos.status, WORKING_VIDEO_STATUSES)))
        .returning({ id: videos.id });

    if (deletedRows.length === 0) {
        throw new UserFacingError("Aguarde o processamento terminar para excluir este vídeo.");
    }

    await rm(resolveStoragePath(getVideoDirectory(videoId)), { recursive: true, force: true });
}
