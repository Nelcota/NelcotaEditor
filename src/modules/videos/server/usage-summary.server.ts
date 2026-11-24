import { and, count, eq, gte, sum } from "drizzle-orm";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import type { StorageUsage, UsageSummary } from "#/modules/videos/model/video-views";
import { videos } from "#/modules/video-records/video-records.schema";
import { getEnvironment } from "#/shared/server/env.server";
import { startOfBusinessMonth } from "#/shared/server/business-time-zone";

const BYTES_PER_GIGABYTE = 1024 * 1024 * 1024;

/** The database or the open transaction that holds the user's start lock. */
type QueryExecutor = Pick<typeof db, "select">;

interface VideoCounts {
    total: number;
    ready: number;
    seconds: number;
}

/** "This month" on the users' calendar (São Paulo), not the server process' time zone. */
function startOfCurrentMonth(): Date {
    return startOfBusinessMonth(new Date());
}

/** SUM over no rows is null (zero); anything non-numeric is a broken query, not zero. */
function toSumNumber(sumText: string | null | undefined): number {
    if (sumText === null || sumText === undefined) {
        return 0;
    }

    const total = Number(sumText);

    if (Number.isFinite(total) === false) {
        throw new TypeError(`Expected a numeric sum, got "${sumText.slice(0, 40)}"`);
    }

    return total;
}

async function countVideos(userId: string): Promise<VideoCounts> {
    const [totalRows, readyRows] = await Promise.all([
        db.select({ total: count() }).from(videos).where(eq(videos.userId, userId)),
        db
            .select({ ready: count(), seconds: sum(videos.durationSeconds) })
            .from(videos)
            .where(and(eq(videos.userId, userId), eq(videos.status, "done"))),
    ]);
    const totalRow = totalRows[0];
    const readyRow = readyRows[0];

    return {
        total: totalRow?.total ?? 0,
        ready: readyRow?.ready ?? 0,
        seconds: toSumNumber(readyRow?.seconds),
    };
}

async function countReadyClips(userId: string, since: Date | null): Promise<number> {
    const conditions = [eq(videos.userId, userId), eq(clips.status, "done")];

    if (since !== null) {
        conditions.push(gte(clips.createdAt, since));
    }

    const rows = await db
        .select({ ready: count() })
        .from(clips)
        .innerJoin(videos, eq(videos.id, clips.videoId))
        .where(and(...conditions));

    return rows[0]?.ready ?? 0;
}

async function countSelectedClips(userId: string): Promise<number> {
    const rows = await db
        .select({ selected: count() })
        .from(clips)
        .innerJoin(videos, eq(videos.id, clips.videoId))
        .where(eq(videos.userId, userId));

    return rows[0]?.selected ?? 0;
}

export function getStorageQuotaBytes(): number {
    const environment = getEnvironment();

    return environment.STORAGE_QUOTA_GIGABYTES * BYTES_PER_GIGABYTE;
}

async function sumSourceBytes(userId: string, executor: QueryExecutor): Promise<number> {
    const rows = await executor
        .select({ bytes: sum(videos.sourceBytes) })
        .from(videos)
        .where(eq(videos.userId, userId));

    return toSumNumber(rows[0]?.bytes);
}

async function sumClipBytes(userId: string, executor: QueryExecutor): Promise<number> {
    const rows = await executor
        .select({ bytes: sum(clips.outputBytes) })
        .from(clips)
        .innerJoin(videos, eq(videos.id, clips.videoId))
        .where(eq(videos.userId, userId));

    return toSumNumber(rows[0]?.bytes);
}

/**
 * Sums the sizes saved with each file instead of walking the disk. Sizes not known yet (a download
 * in progress, rows the worker has not backfilled) count as 0 until they are written.
 */
export async function measureUserStorage(
    userId: string,
    executor: QueryExecutor,
): Promise<StorageUsage> {
    const [sourceBytes, clipBytes] = await Promise.all([
        sumSourceBytes(userId, executor),
        sumClipBytes(userId, executor),
    ]);

    return { totalBytes: sourceBytes + clipBytes, clipBytes, sourceBytes };
}

/** The queries do not depend on each other, so they all run at once. */
export async function summarizeUsage(userId: string): Promise<UsageSummary> {
    const [videoCounts, selectedClipCount, readyClipCount, clipsThisMonth, storage] =
        await Promise.all([
            countVideos(userId),
            countSelectedClips(userId),
            countReadyClips(userId, null),
            countReadyClips(userId, startOfCurrentMonth()),
            measureUserStorage(userId, db),
        ]);

    return {
        videoCount: videoCounts.total,
        readyVideoCount: videoCounts.ready,
        processedSeconds: videoCounts.seconds,
        selectedClipCount,
        readyClipCount,
        clipsThisMonth,
        storage,
        storageQuotaBytes: getStorageQuotaBytes(),
    };
}
