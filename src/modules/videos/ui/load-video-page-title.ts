import type { QueryClient } from "@tanstack/react-query";
import { videoDetailsQueryOptions } from "#/modules/videos/ui/video-queries";

const FALLBACK_TITLE = "Vídeo";

/**
 * Loads the video into the cache (so the page opens with it) and returns its title for the tab.
 * A missing video is not an error here: the screen shows its own message for that.
 */
export async function loadVideoPageTitle(
    queryClient: QueryClient,
    videoId: string,
): Promise<string> {
    const options = videoDetailsQueryOptions(videoId);
    await queryClient.prefetchQuery(options);
    const details = queryClient.getQueryData(options.queryKey);

    if (details === undefined) {
        return FALLBACK_TITLE;
    }

    return details.video.title;
}
