import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { AdminUserListInput, AdminVideoListInput } from "#/modules/admin/admin-search";
import { getAdminUserDetails, getAdminUsers } from "#/modules/admin/server/admin-user-functions";
import { getAdminOverview, getAdminVideos } from "#/modules/admin/server/admin-video-functions";

const ADMIN_QUERY_KEY = "admin";
// Statuses move while the admin watches, but each refresh counts every user, video and clip, so a
// minute is enough; hidden tabs never poll, and coming back to the tab refetches stale data.
const ADMIN_REFRESH_MILLISECONDS = 60 * 1000;

export function adminOverviewQueryOptions() {
    return queryOptions({
        queryKey: [ADMIN_QUERY_KEY, "overview"],
        queryFn: () => getAdminOverview(),
        refetchInterval: ADMIN_REFRESH_MILLISECONDS,
        refetchIntervalInBackground: false,
    });
}

export function adminUsersQueryOptions(input: AdminUserListInput) {
    return queryOptions({
        queryKey: [ADMIN_QUERY_KEY, "users", input],
        queryFn: () => getAdminUsers({ data: input }),
        placeholderData: keepPreviousData,
    });
}

export function adminUserQueryOptions(userId: string) {
    return queryOptions({
        queryKey: [ADMIN_QUERY_KEY, "user", userId],
        queryFn: () => getAdminUserDetails({ data: { userId } }),
    });
}

export function adminVideosQueryOptions(input: AdminVideoListInput) {
    return queryOptions({
        queryKey: [ADMIN_QUERY_KEY, "videos", input],
        queryFn: () => getAdminVideos({ data: input }),
        placeholderData: keepPreviousData,
        refetchInterval: ADMIN_REFRESH_MILLISECONDS,
        refetchIntervalInBackground: false,
    });
}

/** Any admin action can change every admin list and count, so they all refresh. */
export async function invalidateAdminQueries(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY] });
}
