import { and, count, eq, gt, lte, ne, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "#/db/database.server";
import { videoUploads } from "#/modules/videos/videos.schema";
import type { VideoUpload } from "#/modules/videos/videos.schema";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { getVideoDirectory } from "#/shared/server/storage.server";
import { logger } from "#/shared/server/logger.server";

/** The database or the open transaction that holds the user's start lock. */
type QueryExecutor = Pick<typeof db, "select">;

export interface PendingUploads {
    count: number;
    bytes: number;
}

function isUnexpired(): SQL {
    return gt(videoUploads.expiresAt, sql`now()`);
}

/**
 * Uploads granted space and a processing slot that have no video row yet. The one being confirmed
 * is left out, since it is about to become a video.
 */
export async function summarizePendingUploads(
    userId: string,
    executor: QueryExecutor,
    excludedUploadId: string | null,
): Promise<PendingUploads> {
    const conditions = [eq(videoUploads.userId, userId), isUnexpired()];

    if (excludedUploadId !== null) {
        conditions.push(ne(videoUploads.id, excludedUploadId));
    }

    const rows = await executor
        .select({
            count: count(),
            bytes: sql<number>`coalesce(sum(${videoUploads.declaredBytes}), 0)::bigint`.mapWith(
                Number,
            ),
        })
        .from(videoUploads)
        .where(and(...conditions));
    const row = rows[0];

    if (row === undefined) {
        return { count: 0, bytes: 0 };
    }

    return { count: row.count, bytes: row.bytes };
}

/** An expired upload or another person's reads as missing. */
export async function findOwnedPendingUpload(
    uploadId: string,
    userId: string,
): Promise<VideoUpload | null> {
    const rows = await db
        .select()
        .from(videoUploads)
        .where(and(eq(videoUploads.id, uploadId), eq(videoUploads.userId, userId), isUnexpired()))
        .limit(1);

    return rows[0] ?? null;
}

/**
 * Expiring the row claims the upload and frees its slot at once. The row is deleted only after
 * its files, so a store that fails here leaves it for the sweep instead of orphaning the files.
 * When nothing is claimed, a confirmation (whose folder is now a video's) or a sweep got there
 * first, so the files are left to it.
 */
export async function discardPendingUpload(uploadId: string): Promise<void> {
    const claimed = await db
        .update(videoUploads)
        .set({ expiresAt: sql`now()` })
        .where(and(eq(videoUploads.id, uploadId), isUnexpired()))
        .returning({ id: videoUploads.id });

    if (claimed.length === 0) {
        return;
    }

    await getFileStorage().deleteFolder(getVideoDirectory(uploadId));
    await db.delete(videoUploads).where(eq(videoUploads.id, uploadId));
}

/**
 * Frees what abandoned uploads held: any file already sent, then the row. An expired upload can no
 * longer be confirmed, so deleting its files first is safe, and a failure keeps the row for the
 * next sweep. Both steps are idempotent, so two sweeps may overlap.
 */
export async function removeExpiredUploads(): Promise<void> {
    const expired = await db
        .select({ id: videoUploads.id })
        .from(videoUploads)
        .where(lte(videoUploads.expiresAt, sql`now()`));
    const storage = getFileStorage();

    // One at a time: there can be many, and a remote store limits its requests.
    for (const upload of expired) {
        await storage.deleteFolder(getVideoDirectory(upload.id));
        await db.delete(videoUploads).where(eq(videoUploads.id, upload.id));
    }

    if (expired.length > 0) {
        logger.info({ uploadCount: expired.length }, "Expired uploads removed");
    }
}
