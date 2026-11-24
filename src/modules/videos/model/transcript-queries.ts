import { queryOptions } from "@tanstack/react-query";
import { getVideoTranscript } from "#/modules/transcription/server/transcript-functions";
import { VIDEOS_QUERY_KEY } from "#/modules/videos/model/video-queries";

const TRANSCRIPT_KEY = "transcript";

// Under the video's key, so deleting the video drops its transcript from the cache too.
export function transcriptQueryOptions(videoId: string) {
    return queryOptions({
        queryKey: [...VIDEOS_QUERY_KEY, videoId, TRANSCRIPT_KEY],
        queryFn: () => getVideoTranscript({ data: { videoId } }),
        // A transcript never changes once written.
        staleTime: Number.POSITIVE_INFINITY,
    });
}
