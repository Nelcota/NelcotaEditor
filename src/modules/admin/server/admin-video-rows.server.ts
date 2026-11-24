import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "#/db/database.server";
import type { AdminVideoFilter, AdminVideoListInput } from "#/modules/admin/model/admin-search";
import { ADMIN_PAGE_SIZE } from "#/modules/admin/model/admin-search";
import type { AdminVideoPage, AdminVideoRow } from "#/modules/admin/model/admin-views";
import { toContainsPattern } from "#/modules/admin/server/like-pattern.server";
import { user } from "#/modules/auth/auth.schema";
import { clips } from "#/modules/clips/clips.schema";
import { WORKING_VIDEO_STATUSES } from "#/modules/video-records/model/video-status";
import { videos } from "#/modules/video-records/video-records.schema";

// Correlated subqueries instead of a join on a whole-table aggregate: Postgres evaluates them only for
// the rows that survive ORDER BY and LIMIT, so a page reads its own videos' clips, not every clip.
const readyClipCount = db
    .select({ value: count() })
    .from(clips)
    .where(and(eq(clips.videoId, videos.id), eq(clips.status, "done")));

const clipBytes = db
    .select({ value: sql<number>`coalesce(sum(${clips.outputBytes}), 0)` })
    .from(clips)
    .where(eq(clips.videoId, videos.id));

const FILTER_CONDITIONS: Record<AdminVideoFilter, SQL | undefined> = {
    all: undefined,
    working: inArray(videos.status, WORKING_VIDEO_STATUSES),
    queued: eq(videos.status, "queued"),
    failed: eq(videos.status, "failed"),
    cancelled: eq(videos.status, "cancelled"),
    done: eq(videos.status, "done"),
};

/** Title or owner, so a support request ("my video about X", an email) finds the video. */
function toSearchCondition(query: string): SQL | undefined {
    if (query.length === 0) {
        return undefined;
    }

    const pattern = toContainsPattern(query);

    return or(ilike(videos.title, pattern), ilike(user.email, pattern), ilike(user.name, pattern));
}

function toOwnerCondition(ownerId: string | null): SQL | undefined {
    if (ownerId === null) {
        return undefined;
    }

    return eq(videos.userId, ownerId);
}

export function toVideoListCondition(input: AdminVideoListInput): SQL | undefined {
    return and(
        FILTER_CONDITIONS[input.filter],
        toSearchCondition(input.query),
        toOwnerCondition(input.ownerId),
    );
}

interface VideoRowQuery {
    where: SQL | undefined;
    limit: number;
    offset: number;
}

/** Every account's videos with their owner, clip count and the bytes their files take. */
export async function selectAdminVideoRows(query: VideoRowQuery): Promise<Array<AdminVideoRow>> {
    const rows = await db
        .select({
            id: videos.id,
            title: videos.title,
            status: videos.status,
            source: videos.source,
            errorMessage: videos.errorMessage,
            durationSeconds: videos.durationSeconds,
            requestedClipCount: videos.requestedClipCount,
            readyClipCount: sql<number>`(${readyClipCount})`.mapWith(Number),
            storageBytes: sql<number>`coalesce(${videos.sourceBytes}, 0) + (${clipBytes})`.mapWith(
                Number,
            ),
            createdAt: videos.createdAt,
            ownerId: user.id,
            ownerName: user.name,
            ownerEmail: user.email,
        })
        .from(videos)
        .innerJoin(user, eq(user.id, videos.userId))
        .where(query.where)
        .orderBy(desc(videos.createdAt))
        .limit(query.limit)
        .offset(query.offset);

    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

async function countAdminVideos(where: SQL | undefined): Promise<number> {
    const rows = await db
        .select({ total: count() })
        .from(videos)
        .innerJoin(user, eq(user.id, videos.userId))
        .where(where);

    return rows[0]?.total ?? 0;
}

export async function listAdminVideos(input: AdminVideoListInput): Promise<AdminVideoPage> {
    const where = toVideoListCondition(input);
    const offset = (input.page - 1) * ADMIN_PAGE_SIZE;
    const [rows, totalCount] = await Promise.all([
        selectAdminVideoRows({ where, limit: ADMIN_PAGE_SIZE, offset }),
        countAdminVideos(where),
    ]);

    return { videos: rows, totalCount };
}
