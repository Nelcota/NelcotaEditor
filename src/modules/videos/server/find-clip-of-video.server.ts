import { and, eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import type { Clip } from "#/modules/clips/clips.schema";
import { UserFacingError } from "#/shared/server/user-facing-error";

/** The clip only if it belongs to that video; callers check the video's owner first. */
export async function findClipOfVideo(videoId: string, clipId: string): Promise<Clip> {
    const rows = await db
        .select()
        .from(clips)
        .where(and(eq(clips.id, clipId), eq(clips.videoId, videoId)))
        .limit(1);
    const clip = rows[0];

    if (clip === undefined) {
        throw new UserFacingError("Corte não encontrado.");
    }

    return clip;
}
