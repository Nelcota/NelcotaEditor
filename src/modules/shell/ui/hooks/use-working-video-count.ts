import { isVideoFinished } from "#/modules/video-records/model/video-status";
import { useQuery } from "@tanstack/react-query";
import { videosQueryOptions } from "#/modules/videos/model/video-queries";

/** How many videos are still being cut (queued or at work); the sidebar bell's badge. */
export function useWorkingVideoCount(): number {
    const videosQuery = useQuery(videosQueryOptions());
    const videos = videosQuery.data;

    if (videos === undefined) {
        return 0;
    }

    return videos.filter((video) => isVideoFinished(video.status) === false).length;
}
