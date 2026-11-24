import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { AdminUserListInput, AdminVideoListInput } from "#/modules/admin/model/admin-search";
import { getAdminUserDetails, getAdminUsers } from "#/modules/admin/server/admin-user-functions";
import { getAdminOverview, getAdminVideos } from "#/modules/admin/server/admin-video-functions";
import { ADMIN_POLLING_OPTIONS } from "#/modules/admin/model/admin-polling";

const ADMIN_QUERY_KEY = "admin";

export function adminOverviewQueryOptions() {
    return queryOptions({
        queryKey: [ADMIN_QUERY_KEY, "overview"],
        queryFn: () => getAdminOverview(),
        ...ADMIN_POLLING_OPTIONS,
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
        ...ADMIN_POLLING_OPTIONS,
    });
}

/** Any admin action can change every admin list and count, so they all refresh. */
export async function invalidateAdminQueries(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY] });
}
