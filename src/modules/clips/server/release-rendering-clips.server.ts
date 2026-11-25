import { and, eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import type { ClipStatus } from "#/modules/clips/model/clip-status";

/**
 * When a run stops, a clip whose own status write failed would read as rendering forever. A cancel
 * sends it back to the queue for when the user resumes; any other stop marks it failed.
 */
export async function releaseRenderingClips(
    videoId: string,
    nextStatus: Extract<ClipStatus, "pending" | "failed">,
    executor: Pick<typeof db, "update"> = db,
): Promise<void> {
    await executor
        .update(clips)
        .set({ status: nextStatus })
        .where(and(eq(clips.videoId, videoId), eq(clips.status, "rendering")));
}
