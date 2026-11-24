import { infiniteQueryOptions, keepPreviousData, queryOptions } from "@tanstack/react-query";
import { getUsageSummary, listLibraryClips } from "#/modules/videos/server/library-functions";
import type { ClipOrder } from "#/modules/videos/model/clip-order";
import { LIBRARY_CLIPS_PAGE_SIZE } from "#/modules/videos/model/library-clips-page";
import type { LibraryClipCursor } from "#/modules/videos/model/library-clips-page";
import { VIDEOS_QUERY_KEY } from "#/modules/videos/model/video-queries";

const USAGE_KEY = "usage";
// The first page has no cursor; typed so later pages may carry one.
const FIRST_PAGE: LibraryClipCursor | null = null;

/**
 * Every search and order of the Cortes tab lives under this key; invalidating it refreshes them
 * all. Under the videos key, so creating, retrying or deleting a video refreshes these too.
 */
export const LIBRARY_CLIPS_QUERY_KEY = [...VIDEOS_QUERY_KEY, "library-clips"];

export interface LibraryClipsRequest {
    query: string;
    order: ClipOrder;
}

export function libraryClipsQueryOptions(request: LibraryClipsRequest) {
    const { query, order } = request;

    return infiniteQueryOptions({
        queryKey: [...LIBRARY_CLIPS_QUERY_KEY, { query, order }],
        queryFn: ({ pageParam }) =>
            listLibraryClips({
                data: { query, order, cursor: pageParam, limit: LIBRARY_CLIPS_PAGE_SIZE },
            }),
        initialPageParam: FIRST_PAGE,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        // A new search keeps the current clips on screen until its own arrive.
        placeholderData: keepPreviousData,
    });
}

export function usageQueryOptions() {
    return queryOptions({
        queryKey: [...VIDEOS_QUERY_KEY, USAGE_KEY],
        queryFn: () => getUsageSummary(),
    });
}
