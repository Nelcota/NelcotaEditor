import { count, desc, eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "#/db/database.server";
import { readPhotoExtension } from "#/modules/auth/avatar";
import { ADMIN_ROLE, user } from "#/modules/auth/auth.schema";
import type { AdminUserRow } from "#/modules/admin/admin-views";
import { clips } from "#/modules/clips/clips.schema";
import { videos } from "#/modules/video-records/videos.schema";

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

const storageBytes = sql<number>`coalesce(${videoTotals.sourceBytes}, 0) + coalesce(${clipTotals.clipBytes}, 0)`;

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

/** Each account with its video count and the bytes its files take, in one query. */
export async function selectAdminUserRows(query: UserRowQuery): Promise<Array<AdminUserRow>> {
    let order = [desc(user.createdAt)];

    if (query.orderBy === "storage") {
        order = [desc(storageBytes), desc(user.createdAt)];
    }

    const rows = await db
        .select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            banned: user.banned,
            videoCount: sql<number>`coalesce(${videoTotals.videoCount}, 0)`.mapWith(Number),
            storageBytes: storageBytes.mapWith(Number),
            createdAt: user.createdAt,
        })
        .from(user)
        .leftJoin(videoTotals, eq(videoTotals.userId, user.id))
        .leftJoin(clipTotals, eq(clipTotals.userId, user.id))
        .where(query.where)
        .orderBy(...order)
        .limit(query.limit)
        .offset(query.offset);

    return rows.map(toAdminUserRow);
}
