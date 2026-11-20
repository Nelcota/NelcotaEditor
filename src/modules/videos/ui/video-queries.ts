import { queryOptions } from "@tanstack/react-query";
import { getVideoDetails, listVideos } from "#/modules/videos/server/video-functions";
import { isVideoFinished } from "#/modules/videos/video-status";
import type { VideoStatus } from "#/modules/videos/video-status";

const POLL_INTERVAL_MILLISECONDS = 2_500;

export const VIDEOS_QUERY_KEY = ["videos"];

function pollWhileProcessing(statuses: Array<VideoStatus>): number | false {
    if (statuses.every(isVideoFinished) === true) {
        return false;
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
