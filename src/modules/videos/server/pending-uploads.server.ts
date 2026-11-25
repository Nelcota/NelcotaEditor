import { and, count, eq, gt, isNull, lte, ne, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "#/db/database.server";
import { videoUploads } from "#/modules/videos/videos.schema";
import type { VideoUpload } from "#/modules/videos/videos.schema";
import { MAX_UPLOAD_BYTES } from "#/modules/video-records/model/upload-limits";
import type { DeletedVideo } from "#/modules/video-records/server/stop-video.server";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { getVideoDirectory } from "#/shared/server/storage.server";
import { logger } from "#/shared/server/logger.server";

/** The database or the open transaction that holds the user's start lock. */
type QueryExecutor = Pick<typeof db, "select">;

/** The open transaction that deletes the video the hold stands in for. */
type InsertExecutor = Pick<typeof db, "insert">;

export interface PendingUploads {
    /** Active uploads for clips, which hold one of the clip processing slots. */
    count: number;
    /** Active uploads of raw videos for a format edit, which have slots of their own. */
    formatCount: number;
    bytes: number;
}

/**
 * Long enough for 5 GB on a slow connection; an abandoned upload holds its slot no longer. A PUT
 * started through the upload link may still finish until then, so space stays held that long.
 */
export const UPLOAD_RESERVATION_MILLISECONDS = 6 * 60 * 60 * 1000;

function isUnexpired(): SQL {
    return gt(videoUploads.expiresAt, sql`now()`);
}

/** An upload that can still be sent through the app and confirmed. */
function isActive(): SQL | undefined {
    return and(isUnexpired(), isNull(videoUploads.cancelledAt));
}

/**
 * Uploads that have no video row yet. Only active ones hold a processing slot; cancelled ones
 * still hold their space, since their link may still write the file. The one being confirmed is
 * left out, since it is about to become a video.
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
            count: count(
                sql`case when ${videoUploads.cancelledAt} is null and ${videoUploads.purpose} = 'clips' then 1 end`,
            ),
            formatCount: count(
                sql`case when ${videoUploads.cancelledAt} is null and ${videoUploads.purpose} = 'format' then 1 end`,
            ),
            bytes: sql<number>`coalesce(sum(${videoUploads.declaredBytes}), 0)::bigint`.mapWith(
                Number,
            ),
        })
        .from(videoUploads)
        .where(and(...conditions));
    const row = rows[0];

    if (row === undefined) {
        return { count: 0, formatCount: 0, bytes: 0 };
    }

    return { count: row.count, formatCount: row.formatCount, bytes: row.bytes };
}

/** An expired or cancelled upload, or another person's, reads as missing. */
export async function findOwnedPendingUpload(
    uploadId: string,
    userId: string,
): Promise<VideoUpload | null> {
    const rows = await db
        .select()
        .from(videoUploads)
        .where(and(eq(videoUploads.id, uploadId), eq(videoUploads.userId, userId), isActive()))
        .limit(1);

    return rows[0] ?? null;
}

/**
 * Marking the row cancelled claims the upload and frees its slot at once. The link stays valid, so
 * the row keeps holding the space until it expires and the sweep deletes whatever arrives late.
 * When nothing is claimed, a confirmation (whose folder is now a video's), an earlier cancel or a
 * sweep got there first, so the files are left to it.
 */
export async function discardPendingUpload(uploadId: string): Promise<void> {
    const claimed = await db
        .update(videoUploads)
        .set({ cancelledAt: sql`now()` })
        .where(and(eq(videoUploads.id, uploadId), isActive()))
        .returning({ id: videoUploads.id });

    if (claimed.length === 0) {
        return;
    }

    await getFileStorage().deleteFolder(getVideoDirectory(uploadId));
}

/**
 * The upload link of a video made from an upload may outlive the video: a PUT through it would
 * write the file again with no row pointing at it. A cancelled upload row in its place keeps the
 * space counted for as long as the reservation could have lasted, and the sweep deletes what
 * arrives. Run it in the transaction that deletes the video, so the space is never free in between.
 */
export async function holdUploadOfDeletedVideo(
    video: DeletedVideo,
    executor: InsertExecutor,
): Promise<void> {
    const { sourcePath, sourceBytes } = video;
    // The video row is created after its reservation, so this ends no earlier than the link.
    const expiresAt = new Date(video.createdAt.getTime() + UPLOAD_RESERVATION_MILLISECONDS);

    if (video.source !== "upload" || sourcePath === null || sourceBytes === null) {
        return;
    }

    if (sourceBytes <= 0 || expiresAt.getTime() <= Date.now()) {
        return;
    }

    await executor
        .insert(videoUploads)
        .values({
            id: video.id,
            userId: video.userId,
            sourcePath,
            // The video's size also counts its thumbnail, but the link never takes more than this.
            declaredBytes: Math.min(sourceBytes, MAX_UPLOAD_BYTES),
            title: video.title,
            requestedClipCount: video.requestedClipCount,
            clipLength: video.clipLength,
            transcriptionLanguage: video.transcriptionLanguage ?? "",
            expiresAt,
            cancelledAt: new Date(),
        })
        .onConflictDoNothing();
}

/**
 * Frees what abandoned and cancelled uploads held: any file already sent, then the row. An expired
 * upload can no longer be confirmed or written, so deleting its files first is safe, and a failure keeps the row for the
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
