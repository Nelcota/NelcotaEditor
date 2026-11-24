import { queryOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { isNotFound } from "@tanstack/react-router";
import type { VideoDetails } from "#/modules/videos/model/video-views";
import { getVideoDetails, listVideos } from "#/modules/videos/server/video-functions";
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

/**
 * The whole list, fetched on load and after changes. It does not poll itself: useVideosQuery
 * polls the light progress endpoint and refetches this only when a video changes stage.
 */
export function videosQueryOptions() {
    return queryOptions({
        queryKey: VIDEOS_QUERY_KEY,
        queryFn: () => listVideos(),
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
