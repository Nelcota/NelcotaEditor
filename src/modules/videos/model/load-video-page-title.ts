import type { QueryClient } from "@tanstack/react-query";
import { isNotFound } from "@tanstack/react-router";
import { videoDetailsQueryOptions } from "#/modules/videos/model/video-queries";

const FALLBACK_TITLE = "Vídeo";

/**
 * Loads the video into the cache (so the page opens with it) and returns its title for the tab.
 * A missing video becomes the 404 page; any other failure is left to the screen, which shows its
 * own message and a way to try again.
 */
export async function loadVideoPageTitle(
    queryClient: QueryClient,
    videoId: string,
): Promise<string> {
    const options = videoDetailsQueryOptions(videoId);

    try {
        const details = await queryClient.ensureQueryData(options);

        return details.video.title;
    } catch (error) {
        if (isNotFound(error) === true) {
            throw error;
        }

        return FALLBACK_TITLE;
    }
}
