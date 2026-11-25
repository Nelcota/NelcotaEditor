import { infiniteQueryOptions, keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { isNotFound } from "@tanstack/react-router";
import type { VideoDetails, VideoSummary } from "#/modules/videos/model/video-views";
import type { VideoFilter } from "#/modules/videos/model/video-list-filter";
import { MAX_VIDEOS_PER_PAGE, VIDEOS_PER_PAGE } from "#/modules/videos/model/video-list-page";
import type { VideoListCursor } from "#/modules/videos/model/video-list-page";
import type { VideoSort } from "#/modules/videos/model/video-sort";
import { countVideos, getVideoDetails, listVideos } from "#/modules/videos/server/video-functions";
import { isVideoFinished } from "#/modules/video-records/model/video-status";
import type { VideoStatus } from "#/modules/video-records/model/video-status";

const POLL_INTERVAL_MILLISECONDS = 2_500;
// A queued video can wait hours behind a long one; its row changes only when the worker starts it.
const QUEUED_POLL_INTERVAL_MILLISECONDS = 10_000;

export const VIDEOS_QUERY_KEY = ["videos"];
// The Studio's queries (the whole transcript's words, each clip's draft) are refreshed on their
// own when a render ends (the clip it shows comes from the video details, which do refresh).
const STUDIO_KEY_SEGMENT = "studio";
/** The list's progress poll, which calls invalidateVideoQueries itself when a stage changes. */
export const PROGRESS_KEY_SEGMENT = "progress";

function isRefreshedAfterChanges(queryKey: ReadonlyArray<unknown>): boolean {
    return (
        queryKey.includes(STUDIO_KEY_SEGMENT) === false &&
        queryKey.includes(PROGRESS_KEY_SEGMENT) === false
    );
}

/**
 * After a video or clip changes: refresh the lists, details, library, overview and usage, but not
 * the open Studio, which would download its full transcript again for a rename or a share. The
 * progress poll is left alone too: it runs on its own interval, and refetching it from inside its
 * own fetch would cancel that fetch.
 */
export async function invalidateVideoQueries(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({
        queryKey: VIDEOS_QUERY_KEY,
        predicate: (query) => isRefreshedAfterChanges(query.queryKey),
    });
}

export function pollWhileProcessing(statuses: Array<VideoStatus>): number | false {
    const unfinished = statuses.filter((status) => isVideoFinished(status) === false);

    if (unfinished.length === 0) {
        return false;
    }

    if (unfinished.every((status) => status === "queued") === true) {
        return QUEUED_POLL_INTERVAL_MILLISECONDS;
    }

    return POLL_INTERVAL_MILLISECONDS;
}

/** Every filter, search and order of the Vídeos list lives under this key. */
export const VIDEO_LIST_QUERY_KEY = [...VIDEOS_QUERY_KEY, "list"];
// The first page has no cursor; typed so later pages may carry one.
const FIRST_PAGE: VideoListCursor | null = null;

export interface VideoListRequest {
    query: string;
    filter: VideoFilter;
    sort: VideoSort;
}

/**
 * The Vídeos list, a page at a time. It does not poll itself: the progress poll writes the moving
 * numbers into it and refetches it only when a video changes stage.
 */
export function videoListQueryOptions(request: VideoListRequest) {
    const { query, filter, sort } = request;

    return infiniteQueryOptions({
        queryKey: [...VIDEO_LIST_QUERY_KEY, { query, filter, sort }],
        queryFn: ({ pageParam }) =>
            listVideos({
                data: { query, filter, sort, cursor: pageParam, limit: VIDEOS_PER_PAGE },
            }),
        initialPageParam: FIRST_PAGE,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        // A new search or filter keeps the current videos on screen until its own arrive.
        placeholderData: keepPreviousData,
    });
}

/** How many videos each status filter holds: the toolbar, the sidebar count and the bell. */
export function videoCountsQueryOptions() {
    return queryOptions({
        queryKey: [...VIDEOS_QUERY_KEY, "counts"],
        queryFn: () => countVideos(),
    });
}

/**
 * The videos still queued or at work, newest first: what the progress poll watches, whatever
 * page or filter the list is on.
 */
export function workingVideosQueryOptions() {
    return queryOptions({
        queryKey: [...VIDEOS_QUERY_KEY, "working"],
        queryFn: async (): Promise<Array<VideoSummary>> => {
            const page = await listVideos({
                data: {
                    query: "",
                    filter: "processing",
                    sort: "newest",
                    cursor: FIRST_PAGE,
                    limit: MAX_VIDEOS_PER_PAGE,
                },
            });

            return page.items;
        },
    });
}

/** A video deleted in another tab answers not found; asking again every 2.5 s would not bring it back. */
export function pollVideoDetails(
    details: VideoDetails | undefined,
    error: unknown,
): number | false {
    if (details === undefined || isNotFound(error) === true) {
        return false;
    }

    return pollWhileProcessing([details.video.status]);
}

export function videoDetailsQueryOptions(videoId: string) {
    return queryOptions({
        queryKey: [...VIDEOS_QUERY_KEY, videoId],
        queryFn: () => getVideoDetails({ data: { videoId } }),
        retry: false,
        refetchInterval: (query) => pollVideoDetails(query.state.data, query.state.error),
    });
}
