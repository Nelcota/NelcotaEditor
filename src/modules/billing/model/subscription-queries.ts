import { queryOptions } from "@tanstack/react-query";
import type { SubscriptionView } from "#/modules/billing/model/subscription-view";
import { getMySubscription } from "#/modules/billing/server/subscription-functions";

const PENDING_POLL_MILLISECONDS = 5_000;

/** While a checkout can still be paid, keeps asking so the page changes once Asaas confirms. */
function toPollInterval(subscription: SubscriptionView | null | undefined): number | false {
    if (subscription === undefined || subscription === null || subscription.status !== "pending") {
        return false;
    }

    if (new Date(subscription.checkoutExpiresAt).getTime() < Date.now()) {
        return false;
    }

    return PENDING_POLL_MILLISECONDS;
}

export function mySubscriptionQueryOptions() {
    return queryOptions({
        queryKey: ["billing", "my-subscription"],
        queryFn: ({ signal }) => getMySubscription({ signal }),
        refetchInterval: (query) => toPollInterval(query.state.data),
    });
}
