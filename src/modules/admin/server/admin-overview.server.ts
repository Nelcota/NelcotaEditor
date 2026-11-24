import { subDays } from "date-fns";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import type { SQL, SQLWrapper } from "drizzle-orm";
import { db } from "#/db/database.server";
import type { AdminOverview } from "#/modules/admin/admin-views";
import { selectAdminUserRows } from "#/modules/admin/server/admin-user-rows.server";
import { selectAdminVideoRows } from "#/modules/admin/server/admin-video-rows.server";
import { ADMIN_ROLE, user } from "#/modules/auth/auth.schema";
import { clips } from "#/modules/clips/clips.schema";
import { getStorageQuotaBytes } from "#/modules/videos/server/usage-summary.server";
import { WORKING_VIDEO_STATUSES } from "#/modules/video-records/video-status";
import { videos } from "#/modules/video-records/videos.schema";

const RECENT_DAYS = 30;
const HIGHLIGHT_ROW_COUNT = 5;

interface UserCounts {
    total: number;
    recent: number;
    banned: number;
    admins: number;
}

interface VideoCounts {
    total: number;
    recent: number;
    queued: number;
    working: number;
    failed: number;
    processedSeconds: number;
    sourceBytes: number;
}

interface ClipCounts {
    ready: number;
    recent: number;
    clipBytes: number;
}

/** count(*) and SUM come back as text from Postgres; every total here is a plain number. */
function countWhere(condition: SQLWrapper | undefined): SQL<number> {
    return sql<number>`count(*) filter (where ${condition})`.mapWith(Number);
}

async function countUsers(since: Date): Promise<UserCounts | undefined> {
    const rows = await db
        .select({
            total: sql<number>`count(*)`.mapWith(Number),
            recent: countWhere(gte(user.createdAt, since)),
            banned: countWhere(eq(user.banned, true)),
            admins: countWhere(eq(user.role, ADMIN_ROLE)),
        })
        .from(user);

    return rows[0];
}

async function countVideos(since: Date): Promise<VideoCounts | undefined> {
    const rows = await db
        .select({
            total: sql<number>`count(*)`.mapWith(Number),
            recent: countWhere(gte(videos.createdAt, since)),
            queued: countWhere(eq(videos.status, "queued")),
            working: countWhere(inArray(videos.status, WORKING_VIDEO_STATUSES)),
            failed: countWhere(eq(videos.status, "failed")),
            processedSeconds:
                sql<number>`coalesce(sum(${videos.durationSeconds}) filter (where ${videos.status} = 'done'), 0)`.mapWith(
                    Number,
                ),
            sourceBytes: sql<number>`coalesce(sum(${videos.sourceBytes}), 0)`.mapWith(Number),
        })
        .from(videos);

    return rows[0];
}

async function countClips(since: Date): Promise<ClipCounts | undefined> {
    const rows = await db
        .select({
            ready: countWhere(eq(clips.status, "done")),
            recent: countWhere(and(eq(clips.status, "done"), gte(clips.createdAt, since))),
            clipBytes: sql<number>`coalesce(sum(${clips.outputBytes}), 0)`.mapWith(Number),
        })
        .from(clips);

    return rows[0];
}

export async function summarizeAdminOverview(): Promise<AdminOverview> {
    const since = subDays(new Date(), RECENT_DAYS);
    const [userCounts, videoCounts, clipCounts, recentFailures, topStorageUsers] =
        await Promise.all([
            countUsers(since),
            countVideos(since),
            countClips(since),
            selectAdminVideoRows({
                where: eq(videos.status, "failed"),
                limit: HIGHLIGHT_ROW_COUNT,
                offset: 0,
            }),
            selectAdminUserRows({
                where: undefined,
                orderBy: "storage",
                limit: HIGHLIGHT_ROW_COUNT,
                offset: 0,
            }),
        ]);

    if (userCounts === undefined || videoCounts === undefined || clipCounts === undefined) {
        throw new Error("Aggregate queries returned no row");
    }

    return {
        userCount: userCounts.total,
        newUserCount: userCounts.recent,
        bannedUserCount: userCounts.banned,
        adminCount: userCounts.admins,
        videoCount: videoCounts.total,
        newVideoCount: videoCounts.recent,
        queuedVideoCount: videoCounts.queued,
        workingVideoCount: videoCounts.working,
        failedVideoCount: videoCounts.failed,
        readyClipCount: clipCounts.ready,
        newClipCount: clipCounts.recent,
        processedSeconds: videoCounts.processedSeconds,
        storageBytes: videoCounts.sourceBytes + clipCounts.clipBytes,
        storageQuotaBytes: getStorageQuotaBytes(),
        recentDays: RECENT_DAYS,
        recentFailures,
        topStorageUsers,
    };
}
