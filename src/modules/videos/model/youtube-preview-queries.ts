import { queryOptions } from "@tanstack/react-query";
import { getYoutubePreview } from "#/modules/videos/server/youtube-preview-functions";

const YOUTUBE_PREVIEW_KEY = "youtube-preview";
// The preview is a courtesy; one retry covers a blip without keeping the form waiting.
const PREVIEW_RETRY_COUNT = 1;

export function youtubePreviewQueryOptions(videoId: string) {
    return queryOptions({
        queryKey: [YOUTUBE_PREVIEW_KEY, videoId],
        queryFn: () => getYoutubePreview({ data: { videoId } }),
        // A video's title does not change while the dialog is open.
        staleTime: Infinity,
        retry: PREVIEW_RETRY_COUNT,
    });
}
