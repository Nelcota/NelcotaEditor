import type { SubscriptionStatus } from "#/modules/billing/model/subscription-plan";

/**
 * What the page needs to know about the person's subscription; null when they never opened one.
 * Dates cross as ISO strings.
 */
export interface SubscriptionView {
    status: SubscriptionStatus;
    hasAccess: boolean;
    /** Until when the paid months give access, grace days included; null before any payment. */
    paidUntil: string | null;
    /** The day the next monthly charge falls due; null before any payment. */
    nextChargeOn: string | null;
    /** While the checkout page may still be paid; the page polls until then. */
    checkoutExpiresAt: string;
}

/** Access comes from what was paid, so a cancelled or late subscription keeps the paid days. */
export function hasPaidAccess(paidUntil: Date | null, now: Date): boolean {
    if (paidUntil === null) {
        return false;
    }

    return paidUntil.getTime() > now.getTime();
}
