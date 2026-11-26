import { z } from "zod";
import {
    AsaasRequestError,
    BillingNotConfiguredError,
} from "#/modules/billing/model/billing-errors";
import { getEnvironment } from "#/shared/server/env.server";
import { logger } from "#/shared/server/logger.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const REQUEST_TIMEOUT_MILLISECONDS = 15_000;
const USER_AGENT = "EditorOculto/1.0";
const CHECKOUT_HOSTS = new Set(["asaas.com", "www.asaas.com", "sandbox.asaas.com"]);
const UNAVAILABLE_MESSAGE = "A assinatura não está disponível agora. Tente de novo mais tarde.";

const checkoutResponseSchema = z.object({ id: z.string().min(1), link: z.url() });

export interface AsaasCheckoutRequest {
    /** Ours, so the subscription and its charges can be traced back to the person. */
    externalReference: string;
    valueInReais: number;
    itemName: string;
    /** YYYY-MM-DD, the day of the first charge. */
    firstDueDate: string;
    successUrl: string;
    cancelUrl: string;
    minutesToExpire: number;
}

export interface AsaasCheckout {
    id: string;
    link: string;
}

function readApiKey(): string {
    const apiKey = getEnvironment().ASAAS_API_KEY;

    if (apiKey === undefined) {
        const cause = new BillingNotConfiguredError("ASAAS_API_KEY");
        logger.error({ error: cause }, "asaas is not configured");
        throw new UserFacingError(UNAVAILABLE_MESSAGE, { cause });
    }

    return apiKey;
}

async function callAsaas(operation: string, path: string, init: RequestInit): Promise<Response> {
    const response = await fetch(new URL(path, getEnvironment().ASAAS_API_URL), {
        ...init,
        headers: {
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
            access_token: readApiKey(),
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MILLISECONDS),
    });

    if (response.ok === false) {
        throw new AsaasRequestError(operation, response.status);
    }

    return response;
}

/** The page is opened in the person's browser, so it must be Asaas's own https page. */
function assertCheckoutLink(link: string): void {
    const url = new URL(link);

    if (url.protocol !== "https:" || CHECKOUT_HOSTS.has(url.hostname) === false) {
        throw new Error(`Asaas returned an unexpected checkout link host: ${url.hostname}`);
    }
}

/** Opens Asaas's hosted page that takes the card and starts the monthly subscription. */
export async function createAsaasCheckout(request: AsaasCheckoutRequest): Promise<AsaasCheckout> {
    const response = await callAsaas("create checkout", "/v3/checkouts", {
        method: "POST",
        body: JSON.stringify({
            billingTypes: ["CREDIT_CARD"],
            chargeTypes: ["RECURRENT"],
            minutesToExpire: request.minutesToExpire,
            externalReference: request.externalReference,
            callback: { successUrl: request.successUrl, cancelUrl: request.cancelUrl },
            items: [{ name: request.itemName, quantity: 1, value: request.valueInReais }],
            subscription: { cycle: "MONTHLY", nextDueDate: request.firstDueDate },
        }),
    });
    const checkout = checkoutResponseSchema.parse(await response.json());
    assertCheckoutLink(checkout.link);
    return checkout;
}

/** Stops future charges; charges already paid stay paid. */
export async function deleteAsaasSubscription(subscriptionId: string): Promise<void> {
    await callAsaas(
        "delete subscription",
        `/v3/subscriptions/${encodeURIComponent(subscriptionId)}`,
        {
            method: "DELETE",
        },
    );
}
