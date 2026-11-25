import { useQuery } from "@tanstack/react-query";
import { videoCountsQueryOptions } from "#/modules/videos/model/video-queries";

/** How many videos are still being cut (queued or at work); the sidebar bell's badge. */
export function useWorkingVideoCount(): number {
    const countsQuery = useQuery(videoCountsQueryOptions());
    const counts = countsQuery.data;

    if (counts === undefined) {
        return 0;
    }

    return counts.processing;
}
