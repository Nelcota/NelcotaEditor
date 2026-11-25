import {
    environmentManager,
    infiniteQueryOptions,
    keepPreviousData,
    queryOptions,
} from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { isNotFound } from "@tanstack/react-router";
import type { AdminUserListInput, AdminVideoListInput } from "#/modules/admin/model/admin-search";
import { getAdminUserDetails, getAdminUsers } from "#/modules/admin/server/admin-user-functions";
import { getAdminOverview, getAdminVideos } from "#/modules/admin/server/admin-video-functions";
import { getAdminAppSwitches } from "#/modules/admin/server/admin-app-switch-functions";
import {
    countSupportWaiting,
    getSupportQueue,
    getSupportTicket,
} from "#/modules/admin/server/admin-support-functions";
import type { StaffTicketFilter } from "#/modules/support/model/staff-ticket-filter";
import type { TicketCursor } from "#/modules/support/model/support-ticket";
import { ADMIN_POLLING_OPTIONS } from "#/modules/admin/model/admin-polling";

const ADMIN_QUERY_KEY = "admin";

const MAX_USER_LOAD_RETRIES = 3;

/**
 * A missing account stays missing; only other failures are worth another try, and only in the
 * browser: on the server the page would wait for every retry before answering.
 */
function shouldRetryResourceLoad(failureCount: number, error: Error): boolean {
    if (isNotFound(error) === true) {
        return false;
    }

    if (environmentManager.isServer() === true) {
        return false;
    }

    return failureCount < MAX_USER_LOAD_RETRIES;
}

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
        retry: shouldRetryResourceLoad,
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

export function adminAppSwitchesQueryOptions() {
    return queryOptions({
        queryKey: [ADMIN_QUERY_KEY, "app-switches"],
        queryFn: () => getAdminAppSwitches(),
    });
}

/** The Admin folder's badge: tickets waiting for an answer, the same count for every admin. */
export function supportWaitingQueryOptions() {
    return queryOptions({
        queryKey: [ADMIN_QUERY_KEY, "support-waiting"],
        queryFn: () => countSupportWaiting(),
        ...ADMIN_POLLING_OPTIONS,
    });
}

const FIRST_TICKET_PAGE: TicketCursor | null = null;

export function supportQueueQueryOptions(filter: StaffTicketFilter) {
    return infiniteQueryOptions({
        queryKey: [ADMIN_QUERY_KEY, "support-queue", filter],
        queryFn: ({ pageParam }) => getSupportQueue({ data: { filter, cursor: pageParam } }),
        initialPageParam: FIRST_TICKET_PAGE,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        ...ADMIN_POLLING_OPTIONS,
    });
}

export function supportTicketQueryOptions(ticketId: string) {
    return queryOptions({
        queryKey: [ADMIN_QUERY_KEY, "support-ticket", ticketId],
        queryFn: () => getSupportTicket({ data: { ticketId } }),
        retry: shouldRetryResourceLoad,
    });
}

/** Any admin action can change every admin list and count, so they all refresh. */
export async function invalidateAdminQueries(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY] });
}
