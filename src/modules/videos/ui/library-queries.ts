import { queryOptions } from "@tanstack/react-query";
import { getUsageSummary, listLibraryClips } from "#/modules/videos/server/library-functions";
import { VIDEOS_QUERY_KEY } from "#/modules/videos/ui/video-queries";

const LIBRARY_CLIPS_KEY = "library-clips";
const USAGE_KEY = "usage";

// Under the videos key, so creating, retrying or deleting a video refreshes these too.
export function libraryClipsQueryOptions() {
    return queryOptions({
        queryKey: [...VIDEOS_QUERY_KEY, LIBRARY_CLIPS_KEY],
        queryFn: () => listLibraryClips(),
    });
}

export function usageQueryOptions() {
    return queryOptions({
        queryKey: [...VIDEOS_QUERY_KEY, USAGE_KEY],
        queryFn: () => getUsageSummary(),
    });
}
