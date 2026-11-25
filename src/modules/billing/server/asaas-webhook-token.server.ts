import { createHash, timingSafeEqual } from "node:crypto";
import { BillingNotConfiguredError } from "#/modules/billing/model/billing-errors";
import { getEnvironment } from "#/shared/server/env.server";

const TOKEN_HEADER = "asaas-access-token";

function toDigest(value: string): Buffer {
    // Equal-length digests let timingSafeEqual compare tokens of any length.
    return createHash("sha256").update(value).digest();
}

/** Whether the request carries the token Asaas was given when the webhook was created. */
export function hasValidAsaasToken(headers: Headers): boolean {
    const expectedToken = getEnvironment().ASAAS_WEBHOOK_TOKEN;

    if (expectedToken === undefined) {
        throw new BillingNotConfiguredError("ASAAS_WEBHOOK_TOKEN");
    }

    const receivedToken = headers.get(TOKEN_HEADER);

    if (receivedToken === null) {
        return false;
    }

    return timingSafeEqual(toDigest(receivedToken), toDigest(expectedToken));
}
