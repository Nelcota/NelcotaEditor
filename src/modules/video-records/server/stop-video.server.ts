import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { canMoveVideoTo } from "#/modules/video-records/server/video-progress.server";
import { WORKING_VIDEO_STATUSES } from "#/modules/video-records/model/video-status";
import { videos } from "#/modules/video-records/video-records.schema";
import type { Video } from "#/modules/video-records/video-records.schema";
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

export type DeletedVideo = Pick<
    Video,
    | "id"
    | "userId"
    | "title"
    | "source"
    | "sourcePath"
    | "sourceBytes"
    | "requestedClipCount"
    | "clipLength"
    | "transcriptionLanguage"
    | "createdAt"
>;

/** The database or the open transaction that also holds the upload link of the video. */
type DeleteExecutor = Pick<typeof db, "delete">;

/**
 * Deletes the row; the caller deletes its files after the commit. The status is checked in the
 * same statement, so a worker that starts in between wins. The owner is matched too, so a caller
 * holding that owner's lock deletes only that owner's video. The caller checks who may delete it.
 *
 * @returns The deleted video, for the caller to clean up after.
 */
export async function deleteStoppedVideoRow(
    video: Pick<Video, "id" | "userId">,
    executor: DeleteExecutor,
): Promise<DeletedVideo> {
    const deletedRows = await executor
        .delete(videos)
        .where(
            and(
                eq(videos.id, video.id),
                eq(videos.userId, video.userId),
                notInArray(videos.status, WORKING_VIDEO_STATUSES),
            ),
        )
        .returning({
            id: videos.id,
            userId: videos.userId,
            title: videos.title,
            source: videos.source,
            sourcePath: videos.sourcePath,
            sourceBytes: videos.sourceBytes,
            requestedClipCount: videos.requestedClipCount,
            clipLength: videos.clipLength,
            transcriptionLanguage: videos.transcriptionLanguage,
            createdAt: videos.createdAt,
        });
    const deletedVideo = deletedRows[0];

    if (deletedVideo === undefined) {
        throw new UserFacingError("Aguarde o processamento terminar para excluir este vídeo.");
    }

    return deletedVideo;
}
