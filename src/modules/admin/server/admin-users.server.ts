import { and, count, desc, eq, gt, ilike, inArray, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "#/db/database.server";
import type { AdminUserListInput } from "#/modules/admin/model/admin-search";
import { ADMIN_PAGE_SIZE } from "#/modules/admin/model/admin-search";
import type {
    AdminSessionView,
    AdminUserDetails,
    AdminUserPage,
} from "#/modules/admin/model/admin-views";
import { selectAdminUserRows } from "#/modules/admin/server/admin-user-rows.server";
import { toContainsPattern } from "#/modules/admin/server/like-pattern.server";
import { session, user } from "#/modules/auth/auth.schema";
import { clips } from "#/modules/clips/clips.schema";
import { getStorageQuotaBytes } from "#/modules/videos/server/usage-summary.server";
import { WORKING_VIDEO_STATUSES } from "#/modules/video-records/model/video-status";
import { videos } from "#/modules/video-records/video-records.schema";

function toUserSearchCondition(query: string): SQL | undefined {
    if (query.length === 0) {
        return undefined;
    }

    const pattern = toContainsPattern(query);

    return or(ilike(user.name, pattern), ilike(user.email, pattern));
}

async function countUsers(where: SQL | undefined): Promise<number> {
    const rows = await db.select({ total: count() }).from(user).where(where);

    return rows[0]?.total ?? 0;
}

export async function listAdminUsers(input: AdminUserListInput): Promise<AdminUserPage> {
    const where = toUserSearchCondition(input.query);
    const offset = (input.page - 1) * ADMIN_PAGE_SIZE;
    const [users, totalCount] = await Promise.all([
        selectAdminUserRows({ where, orderBy: "newest", limit: ADMIN_PAGE_SIZE, offset }),
        countUsers(where),
    ]);

    return { users, totalCount };
}

async function listActiveSessions(userId: string): Promise<Array<AdminSessionView>> {
    const rows = await db
        .select()
        .from(session)
        .where(and(eq(session.userId, userId), gt(session.expiresAt, new Date())))
        .orderBy(desc(session.createdAt));

    return rows.map((row) => ({
        id: row.id,
        userAgent: row.userAgent,
        ipAddress: row.ipAddress,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
        isImpersonation: row.impersonatedBy !== null,
    }));
}

async function countVideoActivity(userId: string): Promise<{ ready: number; working: number }> {
    const [readyRows, workingRows] = await Promise.all([
        db
            .select({ total: count() })
            .from(clips)
            .innerJoin(videos, eq(videos.id, clips.videoId))
            .where(and(eq(videos.userId, userId), eq(clips.status, "done"))),
        db
            .select({ total: count() })
            .from(videos)
            .where(and(eq(videos.userId, userId), inArray(videos.status, WORKING_VIDEO_STATUSES))),
    ]);

    return { ready: readyRows[0]?.total ?? 0, working: workingRows[0]?.total ?? 0 };
}

interface BanDetails {
    banReason: string | null;
    banExpires: Date | null;
}

async function findBanDetails(userId: string): Promise<BanDetails | undefined> {
    const rows = await db
        .select({ banReason: user.banReason, banExpires: user.banExpires })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

    return rows[0];
}

interface UserDetailsRequest {
    userId: string;
    adminId: string;
}

/** The account's details, or null when no account has this id. */
export async function findAdminUserDetails(
    request: UserDetailsRequest,
): Promise<AdminUserDetails | null> {
    const userId = request.userId;
    const [rows, banDetails, activity, sessions] = await Promise.all([
        selectAdminUserRows({ where: eq(user.id, userId), orderBy: "newest", limit: 1, offset: 0 }),
        findBanDetails(userId),
        countVideoActivity(userId),
        listActiveSessions(userId),
    ]);
    const userRow = rows[0];

    if (userRow === undefined || banDetails === undefined) {
        return null;
    }

    return {
        user: userRow,
        banReason: banDetails.banReason,
        banExpiresAt: banDetails.banExpires?.toISOString() ?? null,
        readyClipCount: activity.ready,
        workingVideoCount: activity.working,
        storageQuotaBytes: getStorageQuotaBytes(),
        sessions,
        isCurrentAdmin: userId === request.adminId,
    };
}
