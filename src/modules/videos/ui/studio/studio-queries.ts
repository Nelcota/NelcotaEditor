import { queryOptions } from "@tanstack/react-query";
import { getClipStudio } from "#/modules/videos/server/clip-studio-functions";
import { VIDEOS_QUERY_KEY } from "#/modules/videos/ui/video-queries";

export function clipStudioQueryKey(videoId: string, clipId: string): Array<string> {
    return [...VIDEOS_QUERY_KEY, videoId, "studio", clipId];
}

/**
 * Loaded once per clip: while editing, the browser holds the newest version and saves it, so a
 * background refetch must never replace what the person is typing.
 */
export function clipStudioQueryOptions(videoId: string, clipId: string) {
    return queryOptions({
        queryKey: clipStudioQueryKey(videoId, clipId),
        queryFn: () => getClipStudio({ data: { videoId, clipId } }),
        staleTime: Number.POSITIVE_INFINITY,
        refetchOnWindowFocus: false,
        retry: false,
    });
}
