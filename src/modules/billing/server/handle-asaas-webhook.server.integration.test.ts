import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";

const WEBHOOK_TOKEN = vi.hoisted(() => {
    const token = "test-asaas-webhook-token-0123456789abcdef";
    process.env.ASAAS_WEBHOOK_TOKEN = token;
    return token;
});

import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { subscriptions } from "#/modules/billing/billing.schema";
import { handleAsaasWebhook } from "#/modules/billing/server/handle-asaas-webhook.server";

// Runs against the test database from .env.test: bun run test:integration

async function createSubscriber(): Promise<{ userId: string; checkoutId: string }> {
    const userId = randomUUID();
    const checkoutId = `chk_${randomUUID()}`;
    await db.insert(user).values({
        id: userId,
        name: "Ana Teste",
        email: `billing-${userId}@example.com`,
        emailVerified: true,
    });
    await db.insert(subscriptions).values({
        userId,
        checkoutId,
        checkoutExpiresAt: new Date(Date.now() + 3_600_000),
    });

    return { userId, checkoutId };
}

function postEvent(
    body: Record<string, unknown>,
    token: string = WEBHOOK_TOKEN,
): Promise<Response> {
    return handleAsaasWebhook(
        new Request("http://localhost/api/webhooks/asaas", {
            method: "POST",
            headers: { "asaas-access-token": token, "Content-Type": "application/json" },
            body: JSON.stringify({ id: `evt_${randomUUID()}`, ...body }),
        }),
    );
}

async function readSubscription(
    userId: string,
): Promise<typeof subscriptions.$inferSelect | undefined> {
    const [row] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return row;
}

afterAll(async () => {
    await db.$client.end();
});

describe("handleAsaasWebhook", () => {
    it("refuses an event without the shared token", async () => {
        const { userId, checkoutId } = await createSubscriber();

        const response = await postEvent(
            { event: "CHECKOUT_PAID", checkout: { id: checkoutId } },
            "wrong-token",
        );

        expect(response.status).toBe(401);
        expect((await readSubscription(userId))?.status).toBe("pending");
    });

    it("gives a month of access once the checkout is paid", async () => {
        const { userId, checkoutId } = await createSubscriber();

        await postEvent({ event: "CHECKOUT_PAID", checkout: { id: checkoutId } });

        const row = await readSubscription(userId);
        expect(row?.status).toBe("active");
        expect(row?.paidUntil?.getTime()).toBeGreaterThan(Date.now() + 27 * 86_400_000);
    });

    it("extends access with each monthly payment of the linked subscription", async () => {
        const { userId, checkoutId } = await createSubscriber();
        const subscriptionId = `sub_${randomUUID()}`;
        await postEvent({
            event: "SUBSCRIPTION_CREATED",
            subscription: { id: subscriptionId, checkoutSession: checkoutId },
        });

        await postEvent({
            event: "PAYMENT_CONFIRMED",
            payment: { subscription: subscriptionId, dueDate: "2099-01-10" },
        });

        const row = await readSubscription(userId);
        expect(row?.asaasSubscriptionId).toBe(subscriptionId);
        expect(row?.paidUntil?.toISOString()).toBe("2099-02-13T00:00:00.000Z");
    });

    it("applies a repeated event only once", async () => {
        const { userId, checkoutId } = await createSubscriber();
        const subscriptionId = `sub_${randomUUID()}`;
        await postEvent({
            event: "SUBSCRIPTION_CREATED",
            subscription: { id: subscriptionId, checkoutSession: checkoutId },
        });
        const overdue = {
            id: `evt_${randomUUID()}`,
            event: "PAYMENT_OVERDUE",
            payment: { subscription: subscriptionId, dueDate: "2099-01-10" },
        };
        await postEvent(overdue);
        await db
            .update(subscriptions)
            .set({ status: "active" })
            .where(eq(subscriptions.userId, userId));

        await postEvent(overdue);

        expect((await readSubscription(userId))?.status).toBe("active");
    });

    it("keeps the paid days when the subscription is deleted", async () => {
        const { userId, checkoutId } = await createSubscriber();
        const subscriptionId = `sub_${randomUUID()}`;
        await postEvent({ event: "CHECKOUT_PAID", checkout: { id: checkoutId } });
        await postEvent({
            event: "SUBSCRIPTION_CREATED",
            subscription: { id: subscriptionId, checkoutSession: checkoutId },
        });

        await postEvent({ event: "SUBSCRIPTION_DELETED", subscription: { id: subscriptionId } });

        const row = await readSubscription(userId);
        expect(row?.status).toBe("canceled");
        expect(row?.paidUntil?.getTime()).toBeGreaterThan(Date.now());
    });
});
