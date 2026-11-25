import { db } from "#/db/database.server";
import { asaasWebhookEvents } from "#/modules/billing/billing.schema";
import { BillingNotConfiguredError } from "#/modules/billing/model/billing-errors";
import {
    applyAsaasEvent,
    asaasEventSchema,
} from "#/modules/billing/server/apply-asaas-event.server";
import { hasValidAsaasToken } from "#/modules/billing/server/asaas-webhook-token.server";
import {
    HTTP_BAD_REQUEST,
    HTTP_OK,
    HTTP_SERVICE_UNAVAILABLE,
    HTTP_UNAUTHORIZED,
} from "#/shared/server/http-response";
import { logger } from "#/shared/server/logger.server";

function hasValidToken(request: Request): boolean | null {
    try {
        return hasValidAsaasToken(request.headers);
    } catch (error) {
        if (error instanceof BillingNotConfiguredError) {
            logger.error({ error }, "asaas webhook arrived without a configured token");
            return null;
        }

        throw error;
    }
}

async function readEventBody(request: Request): Promise<unknown> {
    try {
        return await request.json();
    } catch {
        // Not JSON: the schema check below refuses it and logs why.
        return null;
    }
}

/**
 * POST /api/webhooks/asaas. Asaas sends no Origin and no cookie, so the shared token is the only
 * proof the event is real. Each event id is applied once, in the same transaction that records it.
 */
export async function handleAsaasWebhook(request: Request): Promise<Response> {
    const isTokenValid = hasValidToken(request);

    if (isTokenValid === null) {
        return new Response(null, { status: HTTP_SERVICE_UNAVAILABLE });
    }

    if (isTokenValid === false) {
        logger.warn("asaas webhook refused: wrong token");
        return new Response(null, { status: HTTP_UNAUTHORIZED });
    }

    const result = asaasEventSchema.safeParse(await readEventBody(request));

    if (result.success === false) {
        logger.warn({ issues: result.error.issues }, "asaas webhook refused: unexpected body");
        return new Response(null, { status: HTTP_BAD_REQUEST });
    }

    const event = result.data;
    await db.transaction(async (transaction) => {
        const recorded = await transaction
            .insert(asaasWebhookEvents)
            .values({ id: event.id, event: event.event })
            .onConflictDoNothing()
            .returning({ id: asaasWebhookEvents.id });

        if (recorded.length === 0) {
            return;
        }

        await applyAsaasEvent(transaction, event, new Date());
    });
    return new Response(null, { status: HTTP_OK });
}
