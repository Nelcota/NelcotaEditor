import { isVideoWorking } from "#/modules/video-records/model/video-status";
import { useVideosQuery } from "#/modules/videos/ui/hooks/use-videos-query";

/** True while any video is still being processed; the Vídeos tab then shows a small dot. */
export function useHasWorkingVideo(): boolean {
    const videosQuery = useVideosQuery();
    const videos = videosQuery.data;

    if (videos === undefined) {
        return false;
    }

    return videos.some((video) => isVideoWorking(video.status) === true);
}
