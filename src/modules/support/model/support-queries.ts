import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { isNotFound } from "@tanstack/react-router";
import type { TicketCursor } from "#/modules/support/model/support-ticket";
import {
    getHasSupportReply,
    getMyTicket,
    getTicketVideoOptions,
    listMyTickets,
} from "#/modules/support/server/support-functions";

export const SUPPORT_QUERY_KEY = ["support"] as const;

const FIRST_PAGE: TicketCursor | null = null;
const MAX_TICKET_LOAD_RETRIES = 3;
// An answer usually takes hours; checking every minute is plenty for the sidebar dot.
const REPLY_CHECK_MILLISECONDS = 60 * 1000;

/** A missing ticket stays missing; other failures are worth another try. */
function shouldRetryTicketLoad(failureCount: number, error: Error): boolean {
    if (isNotFound(error) === true) {
        return false;
    }

    return failureCount < MAX_TICKET_LOAD_RETRIES;
}

export function myTicketsQueryOptions() {
    return infiniteQueryOptions({
        queryKey: [...SUPPORT_QUERY_KEY, "tickets"],
        queryFn: ({ pageParam }) => listMyTickets({ data: { cursor: pageParam } }),
        initialPageParam: FIRST_PAGE,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });
}

export function myTicketQueryOptions(ticketId: string) {
    return queryOptions({
        queryKey: [...SUPPORT_QUERY_KEY, "ticket", ticketId],
        queryFn: () => getMyTicket({ data: { ticketId } }),
        retry: shouldRetryTicketLoad,
    });
}

export function supportReplyQueryOptions() {
    return queryOptions({
        queryKey: [...SUPPORT_QUERY_KEY, "has-reply"],
        queryFn: () => getHasSupportReply(),
        refetchInterval: REPLY_CHECK_MILLISECONDS,
        refetchIntervalInBackground: false,
    });
}

export function ticketVideoOptionsQueryOptions() {
    return queryOptions({
        queryKey: [...SUPPORT_QUERY_KEY, "video-options"],
        queryFn: () => getTicketVideoOptions(),
    });
}

export async function invalidateSupportQueries(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: SUPPORT_QUERY_KEY });
}
