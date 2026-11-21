import { rm } from "node:fs/promises";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "#/db/database.server";
import { WORKING_VIDEO_STATUSES } from "#/modules/video-records/video-status";
import { videos } from "#/modules/video-records/videos.schema";
import { getVideoDirectory, resolveStoragePath } from "#/shared/server/storage.server";

export async function hasWorkingVideos(userId: string): Promise<boolean> {
    const rows = await db
        .select({ id: videos.id })
        .from(videos)
        .where(and(eq(videos.userId, userId), inArray(videos.status, WORKING_VIDEO_STATUSES)))
        .limit(1);

    return rows.length > 0;
}

export async function listUserVideoIds(userId: string): Promise<Array<string>> {
    const rows = await db.select({ id: videos.id }).from(videos).where(eq(videos.userId, userId));

    return rows.map((row) => row.id);
}

/** Removes the files of videos whose rows are already gone. */
export async function deleteVideoFiles(videoIds: Array<string>): Promise<void> {
    await Promise.all(
        videoIds.map((videoId) =>
            rm(resolveStoragePath(getVideoDirectory(videoId)), { recursive: true, force: true }),
        ),
    );
}
