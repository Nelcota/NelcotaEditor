import { z } from "zod";
import { MAX_VIDEO_TITLE_LENGTH } from "#/modules/video-records/model/video-title";
import { VIDEO_FILTERS } from "#/modules/videos/model/video-list-filter";
import type { VideoFilter } from "#/modules/videos/model/video-list-filter";
import { VIDEO_SORTS } from "#/modules/videos/model/video-sort";
import type { VideoSummary } from "#/modules/videos/model/video-views";

// Divides into every gallery width (1, 2, 3 and 4 columns), so no page ends on a half row.
export const VIDEOS_PER_PAGE = 24;
/** Also the most videos the progress poll watches at once, which asks for one page of them. */
export const MAX_VIDEOS_PER_PAGE = 50;
export const MAX_VIDEO_SEARCH_LENGTH = 120;

/**
 * Where the previous page stopped: the last video's sort values, so the next page starts right
 * after it (keyset) even when videos are added or deleted between the two requests.
 */
export const videoListCursorSchema = z.object({
    id: z.uuid(),
    createdAt: z.iso.datetime(),
    title: z.string().max(MAX_VIDEO_TITLE_LENGTH),
});

export type VideoListCursor = z.infer<typeof videoListCursorSchema>;

export const videoListInputSchema = z.object({
    query: z.string().trim().max(MAX_VIDEO_SEARCH_LENGTH),
    filter: z.enum(VIDEO_FILTERS),
    sort: z.enum(VIDEO_SORTS),
    cursor: videoListCursorSchema.nullable(),
    limit: z.number().int().min(1).max(MAX_VIDEOS_PER_PAGE),
});

export type VideoListInput = z.infer<typeof videoListInputSchema>;

export interface VideoListPage {
    items: Array<VideoSummary>;
    /** Null on the last page. */
    nextCursor: VideoListCursor | null;
    /** Every video that matches the filter and the search, across all pages. */
    totalCount: number;
}

/** How many of the user's videos each status filter shows; the toolbar and the sidebar read it. */
export type VideoCounts = Record<VideoFilter, number>;

export function toVideoListCursor(video: VideoSummary): VideoListCursor {
    return { id: video.id, createdAt: video.createdAt, title: video.title };
}
