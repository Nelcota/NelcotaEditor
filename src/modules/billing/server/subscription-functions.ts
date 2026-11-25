import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import type { SubscriptionView } from "#/modules/billing/model/subscription-view";
import { cancelSubscription } from "#/modules/billing/server/cancel-subscription.server";
import { startSubscriptionCheckout } from "#/modules/billing/server/start-subscription-checkout.server";
import { findSubscriptionView } from "#/modules/billing/server/subscription-queries.server";

export const getMySubscription = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<SubscriptionView | null> =>
        findSubscriptionView(context.user.id),
    );

/** Returns the Asaas page where the person pays; the browser goes there next. */
export const startMySubscription = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<{ checkoutUrl: string }> => ({
        checkoutUrl: await startSubscriptionCheckout(context.user.id),
    }));

export const cancelMySubscription = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<void> => cancelSubscription(context.user.id));
