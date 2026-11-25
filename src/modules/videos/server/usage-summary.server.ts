import { and, count, eq, gte, sql, sum } from "drizzle-orm";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import type { StorageUsage, UsageSummary } from "#/modules/videos/model/video-views";
import { summarizePendingUploads } from "#/modules/videos/server/pending-uploads.server";
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

async function sumSourceBytes(userId: string, executor: QueryExecutor): Promise<number | null> {
    const rows = await executor
        .select({
            bytes: sum(videos.sourceBytes),
            unmeasured: count(
                sql`case when ${videos.sourceBytes} is null and (${videos.sourcePath} is not null or ${videos.thumbnailPath} is not null) then 1 end`,
            ),
        })
        .from(videos)
        .where(eq(videos.userId, userId));

    const totals = rows[0];

    if (totals !== undefined && totals.unmeasured > 0) {
        return null;
    }

    return toSumNumber(totals?.bytes);
}

async function sumClipBytes(userId: string, executor: QueryExecutor): Promise<number | null> {
    const rows = await executor
        .select({
            bytes: sum(clips.outputBytes),
            unmeasured: count(
                sql`case when ${clips.outputBytes} is null and (${clips.outputPath} is not null or ${clips.posterPath} is not null) then 1 end`,
            ),
        })
        .from(clips)
        .innerJoin(videos, eq(videos.id, clips.videoId))
        .where(eq(videos.userId, userId));

    const totals = rows[0];

    if (totals !== undefined && totals.unmeasured > 0) {
        return null;
    }

    return toSumNumber(totals?.bytes);
}

/**
 * An incomplete size makes the total unknown. A video that has not stored any file need not
 * wait for the backfill.
 */
export async function measureUserStorage(
    userId: string,
    executor: QueryExecutor,
): Promise<Omit<StorageUsage, "reservedBytes">> {
    const [sourceBytes, clipBytes] = await Promise.all([
        sumSourceBytes(userId, executor),
        sumClipBytes(userId, executor),
    ]);

    let totalBytes: number | null = null;

    if (sourceBytes !== null && clipBytes !== null) {
        totalBytes = sourceBytes + clipBytes;
    }

    return { totalBytes, clipBytes, sourceBytes };
}

/** What the files take plus what uploads hold, the same space the quota check counts. */
async function measureStorageWithReservations(userId: string): Promise<StorageUsage> {
    const [stored, pendingUploads] = await Promise.all([
        measureUserStorage(userId, db),
        summarizePendingUploads(userId, db, null),
    ]);
    const reservedBytes = pendingUploads.bytes;

    const totalBytes = stored.totalBytes;

    if (totalBytes === null) {
        return { ...stored, reservedBytes };
    }

    return { ...stored, reservedBytes, totalBytes: totalBytes + reservedBytes };
}

/** The queries do not depend on each other, so they all run at once. */
export async function summarizeUsage(userId: string): Promise<UsageSummary> {
    const [videoCounts, selectedClipCount, readyClipCount, clipsThisMonth, storage] =
        await Promise.all([
            countVideos(userId),
            countSelectedClips(userId),
            countReadyClips(userId, null),
            countReadyClips(userId, startOfCurrentMonth()),
            measureStorageWithReservations(userId),
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
