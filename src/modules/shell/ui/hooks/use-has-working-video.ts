import { isVideoWorking } from "#/modules/video-records/model/video-status";
import { useQuery } from "@tanstack/react-query";
import { videosQueryOptions } from "#/modules/videos/model/video-queries";

/** True while any video is still being processed; the Vídeos tab then shows a small dot. */
export function useHasWorkingVideo(): boolean {
    const videosQuery = useQuery(videosQueryOptions());
    const videos = videosQuery.data;

    if (videos === undefined) {
        return false;
    }

    return videos.some((video) => isVideoWorking(video.status) === true);
}
