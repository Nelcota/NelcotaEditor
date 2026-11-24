import { isVideoFinished } from "#/modules/video-records/video-status";
import { useVideosQuery } from "#/modules/videos/ui/use-videos-query";

/** How many videos are still being cut (queued or at work); the sidebar bell's badge. */
export function useWorkingVideoCount(): number {
    const videosQuery = useVideosQuery();
    const videos = videosQuery.data;

    if (videos === undefined) {
        return 0;
    }

    return videos.filter((video) => isVideoFinished(video.status) === false).length;
}
