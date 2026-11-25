import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { subscriptions } from "#/modules/billing/billing.schema";
import {
    createAsaasCheckout,
    deleteAsaasSubscription,
} from "#/modules/billing/server/asaas-client.server";
import { cancelSubscription } from "#/modules/billing/server/cancel-subscription.server";
import { startSubscriptionCheckout } from "#/modules/billing/server/start-subscription-checkout.server";

// Asaas is the external system; its adapter is replaced. Runs with bun run test:integration.
vi.mock("#/modules/billing/server/asaas-client.server", () => ({
    createAsaasCheckout: vi.fn(),
    deleteAsaasSubscription: vi.fn(),
}));

const CHECKOUT_LINK = "https://sandbox.asaas.com/checkoutSession/show/chk_test";

async function createPerson(): Promise<string> {
    const userId = randomUUID();
    await db.insert(user).values({
        id: userId,
        name: "Ana Teste",
        email: `checkout-${userId}@example.com`,
        emailVerified: true,
    });

    return userId;
}

beforeEach(() => {
    vi.mocked(createAsaasCheckout).mockResolvedValue({
        id: `chk_${randomUUID()}`,
        link: CHECKOUT_LINK,
    });
    vi.mocked(deleteAsaasSubscription).mockResolvedValue();
});

afterAll(async () => {
    await db.$client.end();
});

describe("startSubscriptionCheckout", () => {
    it("charges R$ 49,90 a month and remembers the checkout for the webhook", async () => {
        const userId = await createPerson();

        const link = await startSubscriptionCheckout(userId);

        const [row] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
        expect(link).toBe(CHECKOUT_LINK);
        expect(row?.status).toBe("pending");
        expect(vi.mocked(createAsaasCheckout).mock.lastCall?.[0]).toMatchObject({
            externalReference: userId,
            valueInReais: 49.9,
        });
    });

    it("refuses a second checkout while paid days remain", async () => {
        const userId = await createPerson();
        await db.insert(subscriptions).values({
            userId,
            checkoutId: `chk_${randomUUID()}`,
            checkoutExpiresAt: new Date(),
            status: "active",
            paidUntil: new Date(Date.now() + 86_400_000),
        });

        await expect(startSubscriptionCheckout(userId)).rejects.toThrow("Você já é assinante");
    });
});

describe("cancelSubscription", () => {
    it("stops the charges at Asaas and keeps the paid days", async () => {
        const userId = await createPerson();
        const paidUntil = new Date(Date.now() + 86_400_000);
        await db.insert(subscriptions).values({
            userId,
            checkoutId: `chk_${randomUUID()}`,
            checkoutExpiresAt: new Date(),
            asaasSubscriptionId: "sub_cancel_test",
            status: "active",
            paidUntil,
        });

        await cancelSubscription(userId);

        const [row] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
        expect(deleteAsaasSubscription).toHaveBeenCalledWith("sub_cancel_test");
        expect(row?.status).toBe("canceled");
        expect(row?.paidUntil?.getTime()).toBe(paidUntil.getTime());
    });

    it("refuses when there is nothing to cancel", async () => {
        const userId = await createPerson();

        await expect(cancelSubscription(userId)).rejects.toThrow("não tem uma assinatura");
    });
});
