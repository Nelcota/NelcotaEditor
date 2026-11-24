import { and, asc, count, desc, eq, inArray, notInArray, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import {
    FINISHED_VIDEO_STATUSES,
    isOriginalPlayable,
    isVideoFinished,
    isVideoWorking,
} from "#/modules/video-records/model/video-status";
import { toYoutubeThumbnailUrl } from "#/modules/videos/model/youtube-preview";
import { toYoutubeVideoId } from "#/modules/videos/model/youtube-url";
import type { VideoFilter } from "#/modules/videos/model/video-list-filter";
import { toVideoListCursor } from "#/modules/videos/model/video-list-page";
import type {
    VideoCounts,
    VideoListCursor,
    VideoListInput,
    VideoListPage,
} from "#/modules/videos/model/video-list-page";
import type { VideoSort } from "#/modules/videos/model/video-sort";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { normalizeForSearchSql } from "#/modules/videos/server/normalize-for-search-sql.server";
import { videos } from "#/modules/video-records/video-records.schema";
import type { Video } from "#/modules/video-records/video-records.schema";
import { normalizeForSearch } from "#/shared/ui/normalize-for-search";

/** Only the columns a summary is built from; the list never reads paths it does not show. */
const VIDEO_SUMMARY_COLUMNS = {
    id: videos.id,
    title: videos.title,
    source: videos.source,
    status: videos.status,
    progressPercent: videos.progressPercent,
    errorMessage: videos.errorMessage,
    cancelRequested: videos.cancelRequested,
    durationSeconds: videos.durationSeconds,
    requestedClipCount: videos.requestedClipCount,
    clipLength: videos.clipLength,
    createdAt: videos.createdAt,
    processingStartedAt: videos.processingStartedAt,
    sourceUrl: videos.sourceUrl,
    sourcePath: videos.sourcePath,
    thumbnailPath: videos.thumbnailPath,
};

type VideoSummaryRow = Pick<Video, keyof typeof VIDEO_SUMMARY_COLUMNS>;

/**
 * JavaScript dates keep milliseconds and Postgres keeps microseconds; the cursor goes through the
 * browser as an ISO string, so the order and the comparison both use the millisecond value.
 */
const createdAtMilliseconds = sql`date_trunc('milliseconds', ${videos.createdAt})`;
const normalizedTitle = normalizeForSearchSql(videos.title);

/** The worker's frame when there is one; for YouTube links, YouTube's own thumbnail meanwhile. */
function toThumbnailUrl(video: VideoSummaryRow): string | null {
    if (video.thumbnailPath !== null) {
        return `/api/videos/${video.id}/thumbnail`;
    }

    const sourceUrl = video.sourceUrl;

    if (sourceUrl === null) {
        return null;
    }

    const youtubeId = toYoutubeVideoId(sourceUrl);

    if (youtubeId === null) {
        return null;
    }

    return toYoutubeThumbnailUrl(youtubeId);
}

function toOriginalFileUrl(video: VideoSummaryRow): string | null {
    if (video.sourcePath === null || isOriginalPlayable(video.status) === false) {
        return null;
    }

    return `/api/videos/${video.id}/source`;
}

export function toVideoSummary(video: VideoSummaryRow, readyClipCount: number): VideoSummary {
    return {
        id: video.id,
        title: video.title,
        source: video.source,
        status: video.status,
        progressPercent: video.progressPercent,
        errorMessage: video.errorMessage,
        isCancelling: video.cancelRequested && isVideoWorking(video.status),
        durationSeconds: video.durationSeconds,
        requestedClipCount: video.requestedClipCount,
        clipLength: video.clipLength,
        readyClipCount,
        createdAt: video.createdAt.toISOString(),
        processingStartedAt: video.processingStartedAt?.toISOString() ?? null,
        sourceUrl: video.sourceUrl,
        thumbnailUrl: toThumbnailUrl(video),
        originalFileUrl: toOriginalFileUrl(video),
    };
}

const FILTER_CONDITIONS: Record<VideoFilter, () => SQL | undefined> = {
    all: () => undefined,
    processing: () => notInArray(videos.status, FINISHED_VIDEO_STATUSES),
    done: () => eq(videos.status, "done"),
    failed: () => eq(videos.status, "failed"),
    cancelled: () => eq(videos.status, "cancelled"),
};

function matchesSearch(query: string): SQL | undefined {
    const normalizedQuery = normalizeForSearch(query);

    if (normalizedQuery.length === 0) {
        return undefined;
    }

    return sql`strpos(${normalizedTitle}, ${normalizedQuery}) > 0`;
}

function comesAfterNewest(cursor: VideoListCursor): SQL | undefined {
    const cursorCreatedAt = new Date(cursor.createdAt);

    return sql`(${createdAtMilliseconds}, ${videos.id}) < (${cursorCreatedAt}, ${cursor.id})`;
}

function comesAfterOldest(cursor: VideoListCursor): SQL | undefined {
    const cursorCreatedAt = new Date(cursor.createdAt);

    return sql`(${createdAtMilliseconds}, ${videos.id}) > (${cursorCreatedAt}, ${cursor.id})`;
}

function comesAfterTitle(cursor: VideoListCursor): SQL | undefined {
    const cursorTitle = normalizeForSearchSql(sql`${cursor.title}::text`);

    return or(
        sql`${normalizedTitle} > ${cursorTitle}`,
        and(sql`${normalizedTitle} = ${cursorTitle}`, sql`${videos.id} > ${cursor.id}`),
    );
}

const COMES_AFTER: Record<VideoSort, (cursor: VideoListCursor) => SQL | undefined> = {
    newest: comesAfterNewest,
    oldest: comesAfterOldest,
    title: comesAfterTitle,
};

const ORDER_BY: Record<VideoSort, Array<SQL>> = {
    newest: [desc(createdAtMilliseconds), desc(videos.id)],
    oldest: [asc(createdAtMilliseconds), asc(videos.id)],
    title: [asc(normalizedTitle), asc(videos.id)],
};

function startAfter(sort: VideoSort, cursor: VideoListCursor | null): SQL | undefined {
    if (cursor === null) {
        return undefined;
    }

    return COMES_AFTER[sort](cursor);
}

export async function countReadyClips(videoIds: Array<string>): Promise<Map<string, number>> {
    if (videoIds.length === 0) {
        return new Map();
    }

    const rows = await db
        .select({ videoId: clips.videoId, readyCount: count() })
        .from(clips)
        .where(and(inArray(clips.videoId, videoIds), eq(clips.status, "done")))
        .groupBy(clips.videoId);

    return new Map(rows.map((row) => [row.videoId, row.readyCount]));
}

/** One page of the user's videos that match the filter and the search, in the asked order. */
export async function listUserVideosPage(
    userId: string,
    input: VideoListInput,
): Promise<VideoListPage> {
    const { query, filter, sort, cursor, limit } = input;
    const matching = and(
        eq(videos.userId, userId),
        FILTER_CONDITIONS[filter](),
        matchesSearch(query),
    );
    const [rows, countRows] = await Promise.all([
        db
            .select(VIDEO_SUMMARY_COLUMNS)
            .from(videos)
            .where(and(matching, startAfter(sort, cursor)))
            .orderBy(...ORDER_BY[sort])
            // One more than the page: if it comes back, there is a next page.
            .limit(limit + 1),
        db.select({ total: count() }).from(videos).where(matching),
    ]);
    const pageRows = rows.slice(0, limit);
    const readyCounts = await countReadyClips(pageRows.map((row) => row.id));
    const items = pageRows.map((row) => toVideoSummary(row, readyCounts.get(row.id) ?? 0));
    const totalCount = countRows[0]?.total ?? 0;
    const lastItem = items.at(-1);

    if (rows.length <= limit || lastItem === undefined) {
        return { items, nextCursor: null, totalCount };
    }

    return { items, nextCursor: toVideoListCursor(lastItem), totalCount };
}

/** How many of the user's videos each status filter holds, in one grouped query. */
export async function countUserVideos(userId: string): Promise<VideoCounts> {
    const rows = await db
        .select({ status: videos.status, total: count() })
        .from(videos)
        .where(eq(videos.userId, userId))
        .groupBy(videos.status);
    const counts: VideoCounts = { all: 0, processing: 0, done: 0, failed: 0, cancelled: 0 };

    for (const row of rows) {
        counts.all += row.total;

        if (isVideoFinished(row.status) === false) {
            counts.processing += row.total;
        }

        if (row.status === "done" || row.status === "failed" || row.status === "cancelled") {
            counts[row.status] += row.total;
        }
    }

    return counts;
}
