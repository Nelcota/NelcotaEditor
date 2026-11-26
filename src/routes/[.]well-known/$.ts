import { createFileRoute } from "@tanstack/react-router";
import { handleAuthRequest } from "#/modules/auth/server/handle-auth-request.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

/**
 * OAuth discovery for a person's Claude: the protected resource metadata (RFC 9728) for /api/mcp
 * and the authorization server metadata (RFC 8414). Better Auth's MCP plugin answers both; this
 * only forwards the root paths that sit outside /api/auth.
 */
export const Route = createFileRoute("/.well-known/$")({
    server: {
        handlers: {
            GET: ({ request }) =>
                handleApiRoute("GET /.well-known/$", () => handleAuthRequest(request)),
        },
    },
});
