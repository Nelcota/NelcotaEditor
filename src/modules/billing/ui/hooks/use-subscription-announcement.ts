import { useState } from "react";
import type { SubscriptionView } from "#/modules/billing/model/subscription-view";

const ACTIVE_ANNOUNCEMENT = "Assinatura ativa. Os formatos de assinante estão liberados.";

/**
 * What a screen reader hears when the payment is confirmed while the page waits for it. Asaas
 * confirms in the background and the page only polls, so the swap would otherwise be silent.
 */
export function useSubscriptionAnnouncement(
    subscription: SubscriptionView | null | undefined,
): string {
    const [hasWaited, setHasWaited] = useState(false);

    if (subscription === undefined) {
        return "";
    }

    // Stored during render, as React advises for state that follows earlier renders.
    if ((subscription === null || subscription.hasAccess === false) && hasWaited === false) {
        setHasWaited(true);
    }

    if (hasWaited === false || subscription === null || subscription.hasAccess === false) {
        return "";
    }

    return ACTIVE_ANNOUNCEMENT;
}
