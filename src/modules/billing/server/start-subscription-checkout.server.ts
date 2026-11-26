import { addMinutes } from "date-fns";
import { db } from "#/db/database.server";
import { subscriptions } from "#/modules/billing/billing.schema";
import {
    CENTS_PER_REAL,
    CHECKOUT_LIFETIME_MINUTES,
    SUBSCRIPTION_ITEM_NAME,
    SUBSCRIPTION_PRICE_CENTS,
} from "#/modules/billing/model/subscription-plan";
import { createAsaasCheckout } from "#/modules/billing/server/asaas-client.server";
import { findSubscriptionView } from "#/modules/billing/server/subscription-queries.server";
import { InvalidEnvironmentError, getEnvironment } from "#/shared/server/env.server";
import { logger } from "#/shared/server/logger.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const RETURN_PATH = "/formats";
const ALREADY_SUBSCRIBED_MESSAGE = "Você já é assinante. A assinatura aparece em Formatos Virais.";
// Asaas bills in Brazil, so the first charge is today on the Brazilian calendar.
const BRAZIL_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

function readAppOrigin(): string {
    const appUrl = getEnvironment().BETTER_AUTH_URL;

    if (appUrl === undefined) {
        throw new InvalidEnvironmentError(["BETTER_AUTH_URL"]);
    }

    return new URL(appUrl).origin;
}

/**
 * Opens an Asaas checkout for the monthly subscription and remembers it, so the webhook that
 * confirms the payment finds the person. Returns the page to send the person to.
 */
export async function startSubscriptionCheckout(userId: string): Promise<string> {
    const current = await findSubscriptionView(userId);

    // While paid days remain (even after cancelling), a new checkout would charge twice.
    if (current !== null && current.hasAccess === true) {
        throw new UserFacingError(ALREADY_SUBSCRIBED_MESSAGE);
    }

    const now = new Date();
    const appOrigin = readAppOrigin();
    const checkout = await createAsaasCheckout({
        externalReference: userId,
        valueInReais: SUBSCRIPTION_PRICE_CENTS / CENTS_PER_REAL,
        itemName: SUBSCRIPTION_ITEM_NAME,
        firstDueDate: BRAZIL_DATE_FORMAT.format(now),
        successUrl: new URL(RETURN_PATH, appOrigin).toString(),
        cancelUrl: new URL(RETURN_PATH, appOrigin).toString(),
        minutesToExpire: CHECKOUT_LIFETIME_MINUTES,
    });
    const checkoutFields = {
        checkoutId: checkout.id,
        checkoutExpiresAt: addMinutes(now, CHECKOUT_LIFETIME_MINUTES),
        asaasSubscriptionId: null,
        status: "pending" as const,
    };

    await db
        .insert(subscriptions)
        .values({ userId, ...checkoutFields })
        .onConflictDoUpdate({ target: subscriptions.userId, set: checkoutFields });
    logger.info({ userId }, "subscription checkout opened");
    return checkout.link;
}
