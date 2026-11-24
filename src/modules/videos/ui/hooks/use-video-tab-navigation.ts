import { useNavigate } from "@tanstack/react-router";
import type { VideoPageSearch, VideoPageTab } from "#/modules/videos/model/video-page-search";

/** Moves the video page to another tab, keeping the picked clip unless a new one is given. */
export function useVideoTabNavigation(
    videoId: string,
    search: VideoPageSearch,
): (tab: VideoPageTab, clipId?: string) => Promise<void> {
    const navigate = useNavigate();

    return async (tab, clipId) => {
        await navigate({
            to: "/videos/$videoId",
            params: { videoId },
            search: { tab, clip: clipId ?? search.clip },
            replace: true,
        });
    };
}
