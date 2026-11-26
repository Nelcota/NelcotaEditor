import { and, eq, ne } from "drizzle-orm";
import { db } from "#/db/database.server";
import { subscriptions } from "#/modules/billing/billing.schema";
import { deleteAsaasSubscription } from "#/modules/billing/server/asaas-client.server";
import { logger } from "#/shared/server/logger.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const NOTHING_TO_CANCEL_MESSAGE = "Você não tem uma assinatura ativa para cancelar.";

/** Stops the monthly charges at Asaas; the days already paid keep their access. */
export async function cancelSubscription(userId: string): Promise<void> {
    const [row] = await db
        .select({ asaasSubscriptionId: subscriptions.asaasSubscriptionId })
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, userId), ne(subscriptions.status, "canceled")));

    if (row === undefined) {
        throw new UserFacingError(NOTHING_TO_CANCEL_MESSAGE);
    }

    // A checkout that was never paid has no subscription at Asaas yet.
    if (row.asaasSubscriptionId !== null) {
        await deleteAsaasSubscription(row.asaasSubscriptionId);
    }

    await db
        .update(subscriptions)
        .set({ status: "canceled" })
        .where(eq(subscriptions.userId, userId));
    logger.info({ userId }, "subscription canceled");
}
