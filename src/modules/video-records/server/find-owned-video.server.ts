import { and, eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { videos } from "#/modules/video-records/video-records.schema";
import type { Video } from "#/modules/video-records/video-records.schema";
import { UserFacingError } from "#/shared/server/user-facing-error";

/** Ownership is always checked with the session user id, never with an id sent by the client. */
export async function findOwnedVideo(videoId: string, userId: string): Promise<Video> {
    const rows = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
        .limit(1);
    const video = rows[0];

    if (video === undefined) {
        throw new UserFacingError("Vídeo não encontrado.");
    }

    return video;
}
