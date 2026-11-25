import { and, asc, count, desc, eq, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import { CLIP_VIEW_COLUMNS, toClipView } from "#/modules/clips/server/clip-views.server";
import type { ClipViewRow } from "#/modules/clips/server/clip-views.server";
import type { ClipOrder } from "#/modules/videos/model/clip-order";
import { toLibraryClipCursor } from "#/modules/videos/model/library-clips-page";
import type {
    LibraryClipCursor,
    LibraryClipsInput,
    LibraryClipsPage,
} from "#/modules/videos/model/library-clips-page";
import type { LibraryClip } from "#/modules/videos/model/video-views";
import { videos } from "#/modules/video-records/video-records.schema";
import { normalizeForSearch } from "#/shared/ui/normalize-for-search";
import { normalizeForSearchSql } from "#/modules/videos/server/normalize-for-search-sql.server";

/**
 * JavaScript dates keep milliseconds and Postgres keeps microseconds; the cursor goes through the
 * browser as an ISO string, so the order and the comparison both use the millisecond value.
 */
const createdAtMilliseconds = sql`date_trunc('milliseconds', ${clips.createdAt})`;

function matchesSearch(query: string): SQL | undefined {
    const normalizedQuery = normalizeForSearch(query);

    if (normalizedQuery.length === 0) {
        return undefined;
    }

    return or(
        sql`strpos(${normalizeForSearchSql(clips.title)}, ${normalizedQuery}) > 0`,
        sql`strpos(${normalizeForSearchSql(videos.title)}, ${normalizedQuery}) > 0`,
    );
}

/** Newest first; clips of one video share the creation time, so they follow their position. */
function comesAfterByDate(cursor: LibraryClipCursor): SQL | undefined {
    const cursorCreatedAt = new Date(cursor.createdAt);

    return or(
        sql`${createdAtMilliseconds} < ${cursorCreatedAt}`,
        and(
            sql`${createdAtMilliseconds} = ${cursorCreatedAt}`,
            sql`(${clips.position}, ${clips.id}) > (${cursor.position}, ${cursor.id})`,
        ),
    );
}

function comesAfterByScore(cursor: LibraryClipCursor): SQL | undefined {
    return or(
        sql`${clips.score} < ${cursor.score}`,
        and(eq(clips.score, cursor.score), comesAfterByDate(cursor)),
    );
}

const COMES_AFTER: Record<ClipOrder, (cursor: LibraryClipCursor) => SQL | undefined> = {
    newest: comesAfterByDate,
    best: comesAfterByScore,
};

const BY_DATE = [desc(createdAtMilliseconds), asc(clips.position), asc(clips.id)];

const ORDER_BY: Record<ClipOrder, Array<SQL>> = {
    newest: BY_DATE,
    best: [desc(clips.score), ...BY_DATE],
};

function startAfter(order: ClipOrder, cursor: LibraryClipCursor | null): SQL | undefined {
    if (cursor === null) {
        return undefined;
    }

    return COMES_AFTER[order](cursor);
}

function toLibraryClip(row: {
    clip: ClipViewRow;
    videoId: string;
    videoTitle: string;
}): LibraryClip {
    return {
        clip: toClipView(row.clip),
        videoId: row.videoId,
        videoTitle: row.videoTitle,
        createdAt: row.clip.createdAt.toISOString(),
    };
}

/** One page of the user's ready clips that match the search, in the asked order. */
export async function listLibraryClipsPage(
    userId: string,
    input: LibraryClipsInput,
): Promise<LibraryClipsPage> {
    const { query, order, cursor, limit } = input;
    const matching = and(eq(videos.userId, userId), eq(clips.status, "done"), matchesSearch(query));
    const [rows, countRows] = await Promise.all([
        db
            .select({ clip: CLIP_VIEW_COLUMNS, videoId: videos.id, videoTitle: videos.title })
            .from(clips)
            .innerJoin(videos, eq(videos.id, clips.videoId))
            .where(and(matching, startAfter(order, cursor)))
            .orderBy(...ORDER_BY[order])
            // One more than the page: if it comes back, there is a next page.
            .limit(limit + 1),
        db
            .select({ total: count() })
            .from(clips)
            .innerJoin(videos, eq(videos.id, clips.videoId))
            .where(matching),
    ]);
    const items = rows.slice(0, limit).map(toLibraryClip);
    const totalCount = countRows[0]?.total ?? 0;
    const lastItem = items.at(-1);

    if (rows.length <= limit || lastItem === undefined) {
        return { items, nextCursor: null, totalCount };
    }

    return { items, nextCursor: toLibraryClipCursor(lastItem), totalCount };
}
