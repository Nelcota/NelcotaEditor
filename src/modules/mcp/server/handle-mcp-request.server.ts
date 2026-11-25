import { requireMcpAuth } from "@better-auth/mcp";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { z } from "zod";
import { MCP_RESOURCE, auth } from "#/modules/auth/server/auth.server";
import { hasClaudeConsent } from "#/modules/auth/server/claude-connection.server";
import { MissingTokenSubjectError } from "#/modules/mcp/model/mcp-errors";
import { buildMcpServer } from "#/modules/mcp/server/build-mcp-server.server";
import { logger } from "#/shared/server/logger.server";

/** The person the token was issued for and the client it was issued to; the provider sets both. */
const accessTokenSubjectSchema = z.object({
    sub: z.string().trim().min(1),
    azp: z.string().trim().min(1),
});

const HTTP_UNAUTHORIZED = 401;
const PROTECTED_RESOURCE_METADATA_URL = new URL(
    `/.well-known/oauth-protected-resource${new URL(MCP_RESOURCE).pathname}`,
    MCP_RESOURCE,
).toString();

/** The same challenge an expired token gets, so Claude asks the person to connect again. */
function revokedConsentResponse(): Response {
    return Response.json(
        { jsonrpc: "2.0", error: { code: -32001, message: "Access was revoked." }, id: null },
        {
            status: HTTP_UNAUTHORIZED,
            headers: {
                "WWW-Authenticate": `Bearer error="invalid_token", error_description="Access was revoked", resource_metadata="${PROTECTED_RESOURCE_METADATA_URL}"`,
            },
        },
    );
}

/**
 * /api/mcp: Better Auth checks the bearer token's signature, issuer, audience (this resource) and
 * expiry, and answers an unauthenticated request with the challenge that starts Claude's sign-in.
 * The SDK then serves the request statelessly with a server built for that one person.
 */
export const handleMcpRequest = requireMcpAuth(
    auth,
    async (request, accessTokenClaims) => {
        const result = accessTokenSubjectSchema.safeParse(accessTokenClaims);

        if (result.success === false) {
            throw new MissingTokenSubjectError();
        }

        const userId = result.data.sub;

        if ((await hasClaudeConsent(userId, result.data.azp)) === false) {
            logger.warn({ userId }, "MCP call with a revoked consent");
            return revokedConsentResponse();
        }

        const handler = createMcpHandler(() => buildMcpServer(userId), {
            onerror: (error) => logger.warn({ userId, error }, "MCP request rejected"),
        });

        return await handler.fetch(request);
    },
    { resource: MCP_RESOURCE },
);
