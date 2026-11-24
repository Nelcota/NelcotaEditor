import { queryOptions } from "@tanstack/react-query";
import { getStudioWords } from "#/modules/studio/server/clip-studio-functions";
import { getClipStudioSnapshot } from "#/modules/studio/server/clip-studio-snapshot-functions";
import { VIDEOS_QUERY_KEY } from "#/modules/videos/model/video-queries";

export function clipStudioQueryKey(videoId: string, clipId: string): Array<string> {
    return [...VIDEOS_QUERY_KEY, videoId, "studio", clipId];
}

/** The save a Studio sends as it closes; reopening the clip waits for it to land. */
export function clipDraftLeaveSaveKey(videoId: string, clipId: string): Array<string> {
    return ["studio-draft-leave-save", videoId, clipId];
}

/**
 * The transcript words, loaded once per video and shared by every clip: they never change once
 * written. The "studio" segment keeps everyday invalidations from downloading them again.
 */
export function studioWordsQueryOptions(videoId: string) {
    return queryOptions({
        queryKey: [...VIDEOS_QUERY_KEY, videoId, "studio", "words"],
        queryFn: () => getStudioWords({ data: { videoId } }),
        staleTime: Number.POSITIVE_INFINITY,
        refetchOnWindowFocus: false,
        retry: false,
    });
}

/**
 * Loaded once per clip, without the transcript (the words above build its captions). While editing, the browser holds the newest version and saves it, so a
 * background refetch must never replace what the person is typing.
 */
export function clipStudioQueryOptions(videoId: string, clipId: string) {
    return queryOptions({
        queryKey: clipStudioQueryKey(videoId, clipId),
        queryFn: () => getClipStudioSnapshot({ data: { videoId, clipId } }),
        staleTime: Number.POSITIVE_INFINITY,
        refetchOnWindowFocus: false,
        retry: false,
    });
}
