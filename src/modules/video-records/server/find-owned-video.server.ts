import { and, eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { videos } from "#/modules/video-records/video-records.schema";
import type { Video } from "#/modules/video-records/video-records.schema";
import { UserFacingError } from "#/shared/server/user-facing-error";

/**
 * Ownership is always checked with the session user id, never with an id sent by the client.
 * Another user's video comes back as null, the same as a missing one.
 */
export async function findOwnedVideoOrNull(videoId: string, userId: string): Promise<Video | null> {
    const rows = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
        .limit(1);

    return rows[0] ?? null;
}

export async function findOwnedVideo(videoId: string, userId: string): Promise<Video> {
    const video = await findOwnedVideoOrNull(videoId, userId);

    if (video === null) {
        throw new UserFacingError("Vídeo não encontrado.");
    }

    return video;
}
