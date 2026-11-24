import { count, desc, eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "#/db/database.server";
import { readPhotoExtension } from "#/modules/auth/model/avatar";
import { ADMIN_ROLE, user } from "#/modules/auth/auth.schema";
import type { AdminUserRow } from "#/modules/admin/model/admin-views";
import { clips } from "#/modules/clips/clips.schema";
import { videos } from "#/modules/video-records/video-records.schema";

// A page in signup order reads only its own users' videos and clips: Postgres evaluates these
// correlated subqueries after ORDER BY and LIMIT, so they run once per row shown.
const pageVideoCount = db.select({ value: count() }).from(videos).where(eq(videos.userId, user.id));

const pageSourceBytes = db
    .select({ value: sql<number>`coalesce(sum(${videos.sourceBytes}), 0)` })
    .from(videos)
    .where(eq(videos.userId, user.id));

const pageClipBytes = db
    .select({ value: sql<number>`coalesce(sum(${clips.outputBytes}), 0)` })
    .from(clips)
    .innerJoin(videos, eq(videos.id, clips.videoId))
    .where(eq(videos.userId, user.id));

// Ranking by storage needs every account's total before LIMIT, and one grouped pass over the tables
// beats a correlated subquery per account (measured: about 0.1 s against 1 s with 2,000 accounts).
const videoTotals = db
    .select({
        userId: videos.userId,
        videoCount: count(videos.id).as("video_count"),
        sourceBytes: sql<number>`coalesce(sum(${videos.sourceBytes}), 0)`.as("source_bytes"),
    })
    .from(videos)
    .groupBy(videos.userId)
    .as("video_totals");

const clipTotals = db
    .select({
        userId: videos.userId,
        clipBytes: sql<number>`coalesce(sum(${clips.outputBytes}), 0)`.as("clip_bytes"),
    })
    .from(clips)
    .innerJoin(videos, eq(videos.id, clips.videoId))
    .groupBy(videos.userId)
    .as("clip_totals");

const rankedStorageBytes = sql<number>`coalesce(${videoTotals.sourceBytes}, 0) + coalesce(${clipTotals.clipBytes}, 0)`;

interface UserRowQuery {
    where: SQL | undefined;
    orderBy: "newest" | "storage";
    limit: number;
    offset: number;
}

interface SelectedUserRow {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    banned: boolean;
    videoCount: number;
    storageBytes: number;
    createdAt: Date;
}

/** Photos are served to their owner only, so the admin sees initials instead of a broken image. */
function toVisibleImage(image: string | null): string | null {
    if (readPhotoExtension(image) !== null) {
        return null;
    }

    return image;
}

function toAdminUserRow(row: SelectedUserRow): AdminUserRow {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        image: toVisibleImage(row.image),
        isAdmin: row.role === ADMIN_ROLE,
        isBanned: row.banned,
        videoCount: row.videoCount,
        storageBytes: row.storageBytes,
        createdAt: row.createdAt.toISOString(),
    };
}

const USER_COLUMNS = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    banned: user.banned,
    createdAt: user.createdAt,
};

async function selectNewestUserRows(query: UserRowQuery): Promise<Array<SelectedUserRow>> {
    return db
        .select({
            ...USER_COLUMNS,
            videoCount: sql<number>`(${pageVideoCount})`.mapWith(Number),
            storageBytes: sql<number>`(${pageSourceBytes}) + (${pageClipBytes})`.mapWith(Number),
        })
        .from(user)
        .where(query.where)
        .orderBy(desc(user.createdAt))
        .limit(query.limit)
        .offset(query.offset);
}

async function selectTopStorageUserRows(query: UserRowQuery): Promise<Array<SelectedUserRow>> {
    return db
        .select({
            ...USER_COLUMNS,
            videoCount: sql<number>`coalesce(${videoTotals.videoCount}, 0)`.mapWith(Number),
            storageBytes: rankedStorageBytes.mapWith(Number),
        })
        .from(user)
        .leftJoin(videoTotals, eq(videoTotals.userId, user.id))
        .leftJoin(clipTotals, eq(clipTotals.userId, user.id))
        .where(query.where)
        .orderBy(desc(rankedStorageBytes), desc(user.createdAt))
        .limit(query.limit)
        .offset(query.offset);
}

/** Each account with its video count and the bytes its files take, in one query. */
export async function selectAdminUserRows(query: UserRowQuery): Promise<Array<AdminUserRow>> {
    if (query.orderBy === "storage") {
        const rankedRows = await selectTopStorageUserRows(query);

        return rankedRows.map(toAdminUserRow);
    }

    const rows = await selectNewestUserRows(query);

    return rows.map(toAdminUserRow);
}
