import type { QueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";
import { videoDetailsQueryOptions } from "#/modules/videos/model/video-queries";

const videoIdSchema = z.uuid();

/**
 * Loads the video into the cache (so the page opens with it) and returns its title for the tab.
 * A malformed id or a missing video becomes the 404 page; any other failure reaches the error page.
 */
export async function loadVideoPageTitle(
    queryClient: QueryClient,
    videoId: string,
): Promise<string> {
    // Checked here so a typo in the address answers 404 instead of failing the server's validator.
    if (videoIdSchema.safeParse(videoId).success === false) {
        throw notFound();
    }

    const details = await queryClient.ensureQueryData(videoDetailsQueryOptions(videoId));

    return details.video.title;
}
