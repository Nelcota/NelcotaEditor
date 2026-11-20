import path from "node:path";
import { and, count, eq, gte, sum } from "drizzle-orm";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import type { StorageUsage, UsageSummary } from "#/modules/videos/video-views";
import { videos } from "#/modules/videos/videos.schema";
import { getEnvironment } from "#/shared/server/env.server";
import { measureDirectoryBytes } from "#/shared/server/directory-size.server";
import { getVideoDirectory, resolveStoragePath } from "#/shared/server/storage.server";

const CLIPS_DIRECTORY_NAME = "clips";
const BYTES_PER_GIGABYTE = 1024 * 1024 * 1024;
const EMPTY_STORAGE: StorageUsage = { totalBytes: 0, clipBytes: 0, sourceBytes: 0 };

interface VideoCounts {
    total: number;
    ready: number;
    seconds: number;
}

function startOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Postgres returns sums as text and an empty sum as null. */
function toSeconds(sumText: string | null | undefined): number {
    const seconds = Number(sumText ?? 0);

    if (Number.isFinite(seconds) === false) {
        return 0;
    }

    return seconds;
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
        seconds: toSeconds(readyRow?.seconds),
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

async function measureVideoStorage(videoId: string): Promise<StorageUsage> {
    const videoDirectory = getVideoDirectory(videoId);
    const clipsDirectory = path.posix.join(videoDirectory, CLIPS_DIRECTORY_NAME);
    const [totalBytes, clipBytes] = await Promise.all([
        measureDirectoryBytes(resolveStoragePath(videoDirectory)),
        measureDirectoryBytes(resolveStoragePath(clipsDirectory)),
    ]);

    // Both are measured at once; a clip written in between must not make the rest negative.
    return { totalBytes, clipBytes, sourceBytes: Math.max(0, totalBytes - clipBytes) };
}

function addStorage(total: StorageUsage, usage: StorageUsage): StorageUsage {
    return {
        totalBytes: total.totalBytes + usage.totalBytes,
        clipBytes: total.clipBytes + usage.clipBytes,
        sourceBytes: total.sourceBytes + usage.sourceBytes,
    };
}

async function measureUserStorage(userId: string): Promise<StorageUsage> {
    const userVideos = await db
        .select({ id: videos.id })
        .from(videos)
        .where(eq(videos.userId, userId));
    const perVideo = await Promise.all(userVideos.map((video) => measureVideoStorage(video.id)));

    return perVideo.reduce(addStorage, EMPTY_STORAGE);
}

/** The queries do not depend on each other, so they all run at once. */
export async function summarizeUsage(userId: string): Promise<UsageSummary> {
    const [videoCounts, selectedClipCount, readyClipCount, clipsThisMonth, storage] =
        await Promise.all([
            countVideos(userId),
            countSelectedClips(userId),
            countReadyClips(userId, null),
            countReadyClips(userId, startOfCurrentMonth()),
            measureUserStorage(userId),
        ]);

    return {
        videoCount: videoCounts.total,
        readyVideoCount: videoCounts.ready,
        processedSeconds: videoCounts.seconds,
        selectedClipCount,
        readyClipCount,
        clipsThisMonth,
        storage,
        storageQuotaBytes: getEnvironment().STORAGE_QUOTA_GIGABYTES * BYTES_PER_GIGABYTE,
    };
}
