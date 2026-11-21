import { createFileRoute } from "@tanstack/react-router";
import { handleAuthRequest } from "#/modules/auth/server/handle-auth-request.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

export const Route = createFileRoute("/api/auth/$")({
    server: {
        handlers: {
            GET: ({ request }) =>
                handleApiRoute("GET /api/auth/$", () => handleAuthRequest(request)),
            POST: ({ request }) =>
                handleApiRoute("POST /api/auth/$", () => handleAuthRequest(request)),
        },
    },
});
