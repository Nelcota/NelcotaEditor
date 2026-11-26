import { addDays, addMonths } from "date-fns";
import { eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { z } from "zod";
import type { db } from "#/db/database.server";
import { subscriptions } from "#/modules/billing/billing.schema";
import { ACCESS_GRACE_DAYS } from "#/modules/billing/model/subscription-plan";
import type { SubscriptionStatus } from "#/modules/billing/model/subscription-plan";
import { logger } from "#/shared/server/logger.server";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Only the fields we act on; Asaas adds fields over time and those are ignored. */
export const asaasEventSchema = z.object({
    id: z.string().trim().min(1),
    event: z.string().trim().min(1),
    checkout: z.object({ id: z.string().min(1) }).optional(),
    subscription: z
        .object({
            id: z.string().min(1),
            checkoutSession: z.string().nullish(),
            externalReference: z.string().nullish(),
        })
        .optional(),
    payment: z
        .object({
            subscription: z.string().nullish(),
            externalReference: z.string().nullish(),
            dueDate: z.iso.date(),
        })
        .optional(),
});

export type AsaasEvent = z.infer<typeof asaasEventSchema>;

interface SubscriptionLink {
    subscriptionId: string | null;
    checkoutId: string | null;
    userId: string | null;
}

/** Finds the row an event is about: by Asaas subscription, then by checkout, then by our user id. */
async function findRowId(transaction: Transaction, link: SubscriptionLink): Promise<string | null> {
    const conditions: Array<SQL> = [];

    if (link.subscriptionId !== null) {
        conditions.push(eq(subscriptions.asaasSubscriptionId, link.subscriptionId));
    }

    if (link.checkoutId !== null) {
        conditions.push(eq(subscriptions.checkoutId, link.checkoutId));
    }

    // Our user id only claims a row that is not tied to another Asaas subscription yet.
    if (link.userId !== null) {
        conditions.push(
            sql`${subscriptions.userId} = ${link.userId} and ${subscriptions.asaasSubscriptionId} is null`,
        );
    }

    for (const condition of conditions) {
        const [row] = await transaction
            .select({ id: subscriptions.id })
            .from(subscriptions)
            .where(condition);

        if (row !== undefined) {
            return row.id;
        }
    }

    return null;
}

/** Extends access to `until`, never shortening what an earlier payment gave. */
function extendAccess(until: Date): SQL {
    return sql`greatest(${subscriptions.paidUntil}, ${until.toISOString()}::timestamptz)`;
}

function oneMonthFrom(start: Date): Date {
    return addDays(addMonths(start, 1), ACCESS_GRACE_DAYS);
}

interface RowUpdate {
    asaasSubscriptionId?: string;
    status?: SubscriptionStatus;
    paidUntil?: Date | SQL;
}

async function updateRow(
    transaction: Transaction,
    event: AsaasEvent,
    lookup: { link: SubscriptionLink; update: RowUpdate },
): Promise<void> {
    const rowId = await findRowId(transaction, lookup.link);

    if (rowId === null) {
        logger.warn(
            { eventId: event.id, event: event.event },
            "asaas event matches no subscription",
        );
        return;
    }

    await transaction.update(subscriptions).set(lookup.update).where(eq(subscriptions.id, rowId));
}

function applyCheckoutPaid(transaction: Transaction, event: AsaasEvent, now: Date): Promise<void> {
    const checkout = event.checkout;

    if (checkout === undefined) {
        return Promise.resolve();
    }

    return updateRow(transaction, event, {
        link: { subscriptionId: null, checkoutId: checkout.id, userId: null },
        update: { status: "active", paidUntil: extendAccess(oneMonthFrom(now)) },
    });
}

function applySubscriptionCreated(transaction: Transaction, event: AsaasEvent): Promise<void> {
    const subscription = event.subscription;

    if (subscription === undefined) {
        return Promise.resolve();
    }

    return updateRow(transaction, event, {
        link: {
            subscriptionId: subscription.id,
            checkoutId: subscription.checkoutSession ?? null,
            userId: subscription.externalReference ?? null,
        },
        update: { asaasSubscriptionId: subscription.id },
    });
}

function applySubscriptionEnded(transaction: Transaction, event: AsaasEvent): Promise<void> {
    const subscription = event.subscription;

    if (subscription === undefined) {
        return Promise.resolve();
    }

    return updateRow(transaction, event, {
        link: { subscriptionId: subscription.id, checkoutId: null, userId: null },
        update: { status: "canceled" },
    });
}

function toPaymentLink(event: AsaasEvent): SubscriptionLink | null {
    const payment = event.payment;

    if (
        payment === undefined ||
        payment.subscription === undefined ||
        payment.subscription === null
    ) {
        return null;
    }

    return {
        subscriptionId: payment.subscription,
        checkoutId: null,
        userId: payment.externalReference ?? null,
    };
}

function applyPaymentPaid(transaction: Transaction, event: AsaasEvent): Promise<void> {
    const link = toPaymentLink(event);
    const payment = event.payment;

    if (link === null || payment === undefined || link.subscriptionId === null) {
        return Promise.resolve();
    }

    return updateRow(transaction, event, {
        link,
        update: {
            asaasSubscriptionId: link.subscriptionId,
            status: "active",
            paidUntil: extendAccess(oneMonthFrom(new Date(payment.dueDate))),
        },
    });
}

function applyPaymentOverdue(transaction: Transaction, event: AsaasEvent): Promise<void> {
    const link = toPaymentLink(event);

    if (link === null) {
        return Promise.resolve();
    }

    return updateRow(transaction, event, { link, update: { status: "overdue" } });
}

function applyPaymentReversed(
    transaction: Transaction,
    event: AsaasEvent,
    now: Date,
): Promise<void> {
    const link = toPaymentLink(event);

    if (link === null) {
        return Promise.resolve();
    }

    return updateRow(transaction, event, { link, update: { status: "canceled", paidUntil: now } });
}

type EventHandler = (transaction: Transaction, event: AsaasEvent, now: Date) => Promise<void>;

const EVENT_HANDLERS: Readonly<Record<string, EventHandler>> = {
    CHECKOUT_PAID: applyCheckoutPaid,
    SUBSCRIPTION_CREATED: applySubscriptionCreated,
    SUBSCRIPTION_DELETED: applySubscriptionEnded,
    SUBSCRIPTION_INACTIVATED: applySubscriptionEnded,
    PAYMENT_CONFIRMED: applyPaymentPaid,
    PAYMENT_RECEIVED: applyPaymentPaid,
    PAYMENT_OVERDUE: applyPaymentOverdue,
    PAYMENT_REFUNDED: applyPaymentReversed,
    PAYMENT_CHARGEBACK_REQUESTED: applyPaymentReversed,
};

/** Applies one Asaas event to the subscription it is about; other events change nothing. */
export async function applyAsaasEvent(
    transaction: Transaction,
    event: AsaasEvent,
    now: Date,
): Promise<void> {
    const handler = EVENT_HANDLERS[event.event];

    if (handler === undefined) {
        return;
    }

    await handler(transaction, event, now);
}
