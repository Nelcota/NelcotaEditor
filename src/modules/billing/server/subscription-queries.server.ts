import { subDays } from "date-fns";
import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { subscriptions } from "#/modules/billing/billing.schema";
import { ACCESS_GRACE_DAYS } from "#/modules/billing/model/subscription-plan";
import { hasPaidAccess } from "#/modules/billing/model/subscription-view";
import type { SubscriptionView } from "#/modules/billing/model/subscription-view";

function toNextChargeOn(paidUntil: Date | null): string | null {
    if (paidUntil === null) {
        return null;
    }

    return subDays(paidUntil, ACCESS_GRACE_DAYS).toISOString();
}

export async function findSubscriptionView(userId: string): Promise<SubscriptionView | null> {
    const [row] = await db
        .select({
            status: subscriptions.status,
            paidUntil: subscriptions.paidUntil,
            checkoutExpiresAt: subscriptions.checkoutExpiresAt,
        })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));

    if (row === undefined) {
        return null;
    }

    const paidUntil = row.paidUntil;

    return {
        status: row.status,
        hasAccess: hasPaidAccess(paidUntil, new Date()),
        paidUntil: paidUntil?.toISOString() ?? null,
        nextChargeOn: toNextChargeOn(paidUntil),
        checkoutExpiresAt: row.checkoutExpiresAt.toISOString(),
    };
}

/** Whether the person may use the formats reserved for subscribers. */
export async function hasSubscriberAccess(userId: string): Promise<boolean> {
    const subscription = await findSubscriptionView(userId);

    if (subscription === null) {
        return false;
    }

    return subscription.hasAccess;
}
