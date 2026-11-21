import { sql } from "drizzle-orm";
import { fromDrizzle } from "pg-boss";
import type { Db as JobDatabase } from "pg-boss";
import { db } from "#/db/database.server";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface VideoStartScope {
    transaction: Transaction;
    /** Sends pg-boss jobs inside the same transaction. */
    jobDatabase: JobDatabase;
}

const VIDEO_START_LOCK_PREFIX = "video-start:";

/**
 * Runs everything that starts processing for one user (limit and quota checks, the insert or reset,
 * the job) as one unit. The per-user lock makes simultaneous requests of the same person take
 * turns, so two of them can never both pass the checks; other users are not blocked.
 */
export async function runVideoStartTransaction<T>(
    userId: string,
    work: (scope: VideoStartScope) => Promise<T>,
): Promise<T> {
    if (userId.trim().length === 0) {
        throw new RangeError("Cannot start processing for a user without an id");
    }

    const lockKey = `${VIDEO_START_LOCK_PREFIX}${userId}`;

    return db.transaction(async (transaction) => {
        // Released by the commit or the rollback, so a failed request never leaves it held.
        await transaction.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);
        return work({ transaction, jobDatabase: fromDrizzle(transaction, sql) });
    });
}
