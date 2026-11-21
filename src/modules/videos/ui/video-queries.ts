import { queryOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { getVideoDetails, listVideos } from "#/modules/videos/server/video-functions";
import { isVideoFinished } from "#/modules/videos/video-status";
import type { VideoStatus } from "#/modules/videos/video-status";

const POLL_INTERVAL_MILLISECONDS = 2_500;
// A queued video can wait hours behind a long one; its row changes only when the worker starts it.
const QUEUED_POLL_INTERVAL_MILLISECONDS = 10_000;

export const VIDEOS_QUERY_KEY = ["videos"];
// The Studio's query carries the whole transcript and is refreshed on its own when a render ends
// (the clip it shows comes from the video details, which do refresh).
const STUDIO_KEY_SEGMENT = "studio";

function isRefreshedAfterChanges(queryKey: ReadonlyArray<unknown>): boolean {
    return queryKey.includes(STUDIO_KEY_SEGMENT) === false;
}

/**
 * After a video or clip changes: refresh the lists, details, overview and usage, but not the open
 * Studio, which would download its full transcript again for a rename or a share.
 */
export async function invalidateVideoQueries(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({
        queryKey: VIDEOS_QUERY_KEY,
        predicate: (query) => isRefreshedAfterChanges(query.queryKey),
    });
}

function pollWhileProcessing(statuses: Array<VideoStatus>): number | false {
    const unfinished = statuses.filter((status) => isVideoFinished(status) === false);

    if (unfinished.length === 0) {
        return false;
    }

    if (unfinished.every((status) => status === "queued") === true) {
        return QUEUED_POLL_INTERVAL_MILLISECONDS;
    }

    return POLL_INTERVAL_MILLISECONDS;
}

export function videosQueryOptions() {
    return queryOptions({
        queryKey: VIDEOS_QUERY_KEY,
        queryFn: () => listVideos(),
        refetchInterval: (query) => {
            const videos = query.state.data;

            if (videos === undefined) {
                return false;
            }

            return pollWhileProcessing(videos.map((video) => video.status));
        },
    });
}

export function videoDetailsQueryOptions(videoId: string) {
    return queryOptions({
        queryKey: [...VIDEOS_QUERY_KEY, videoId],
        queryFn: () => getVideoDetails({ data: { videoId } }),
        retry: false,
        refetchInterval: (query) => {
            const details = query.state.data;

            if (details === undefined) {
                return false;
            }

            return pollWhileProcessing([details.video.status]);
        },
    });
}
