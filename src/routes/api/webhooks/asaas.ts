import { createFileRoute } from "@tanstack/react-router";
import { handleAsaasWebhook } from "#/modules/billing/server/handle-asaas-webhook.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

/** Where Asaas reports payments and subscription changes; checked by its shared token. */
export const Route = createFileRoute("/api/webhooks/asaas")({
    server: {
        handlers: {
            POST: ({ request }) =>
                handleApiRoute("POST /api/webhooks/asaas", () => handleAsaasWebhook(request)),
        },
    },
});
