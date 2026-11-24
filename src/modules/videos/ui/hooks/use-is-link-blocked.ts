import { useQuery } from "@tanstack/react-query";
import { toLinkVideoId } from "#/modules/videos/model/video-source";
import type { VideoSource } from "#/modules/videos/model/video-source";
import { youtubePreviewQueryOptions } from "#/modules/videos/ui/hooks/youtube-preview-queries";

/** A pasted link only blocks going on when YouTube said for sure it cannot be used. */
export function useIsLinkBlocked(source: VideoSource): boolean {
    const videoId = toLinkVideoId(source);
    const previewQuery = useQuery({
        ...youtubePreviewQueryOptions(videoId ?? ""),
        enabled: videoId !== null,
    });
    const preview = previewQuery.data;

    return videoId !== null && preview !== undefined && preview.kind === "unavailable";
}
