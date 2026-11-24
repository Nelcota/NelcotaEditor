import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { OverviewPeriodDays } from "#/modules/overview/model/overview-period";
import { getOverviewStats } from "#/modules/overview/server/overview-functions";
import { VIDEOS_QUERY_KEY } from "#/modules/videos/ui/hooks/video-queries";

const OVERVIEW_KEY = "overview";
const POLL_INTERVAL_MILLISECONDS = 5_000;

// Under the videos key, so creating, retrying or deleting a video refreshes the numbers too.
export function overviewQueryOptions(periodDays: OverviewPeriodDays) {
    return queryOptions({
        queryKey: [...VIDEOS_QUERY_KEY, OVERVIEW_KEY, periodDays],
        queryFn: () => getOverviewStats({ data: { periodDays } }),
        // Switching periods keeps the old numbers on screen (faded) until the new ones arrive.
        placeholderData: keepPreviousData,
        refetchInterval: (query) => {
            const stats = query.state.data;

            if (stats === undefined || stats.inProgressCount === 0) {
                return false;
            }

            return POLL_INTERVAL_MILLISECONDS;
        },
    });
}
