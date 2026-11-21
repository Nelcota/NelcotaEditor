import { z } from "zod";
import { db } from "#/db/database.server";

const VIDEO_PROCESSING_LOCK_PREFIX = "video-process:";

const lockRowSchema = z.object({ isLocked: z.boolean() });

/**
 * Runs the work only when no other worker is processing the same video, and returns whether it
 * ran. The session lock lives on a dedicated connection held for the whole run: if the worker
 * dies, Postgres drops the connection and the lock with it, so a video is never locked forever.
 */
export async function runWithVideoProcessingLock(
    videoId: string,
    work: () => Promise<void>,
): Promise<boolean> {
    if (videoId.trim().length === 0) {
        throw new RangeError("Cannot lock processing of a video without an id");
    }

    const lockKey = `${VIDEO_PROCESSING_LOCK_PREFIX}${videoId}`;
    const connection = await db.$client.connect();
    let releaseError: Error | undefined = undefined;

    try {
        const result = await connection.query(
            'select pg_try_advisory_lock(hashtext($1)) as "isLocked"',
            [lockKey],
        );
        const lockRow = lockRowSchema.parse(result.rows[0]);

        if (lockRow.isLocked === false) {
            return false;
        }

        try {
            await work();
        } finally {
            await connection.query("select pg_advisory_unlock(hashtext($1))", [lockKey]);
        }

        return true;
    } catch (error) {
        // The unlock may not have run (or the connection broke); destroying the connection is the
        // one way to be sure the lock goes with it instead of returning to the pool.
        releaseError = new Error(`Dropping the processing lock connection of video ${videoId}`, {
            cause: error,
        });
        throw error;
    } finally {
        connection.release(releaseError);
    }
}
