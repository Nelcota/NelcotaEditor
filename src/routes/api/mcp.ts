import { createFileRoute } from "@tanstack/react-router";
import { handleMcpRequest } from "#/modules/mcp/server/handle-mcp-request.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

/** The MCP endpoint a person's Claude connects to; it answers only with a valid access token. */
export const Route = createFileRoute("/api/mcp")({
    server: {
        handlers: {
            POST: ({ request }) => handleApiRoute("POST /api/mcp", () => handleMcpRequest(request)),
            GET: ({ request }) => handleApiRoute("GET /api/mcp", () => handleMcpRequest(request)),
            DELETE: ({ request }) =>
                handleApiRoute("DELETE /api/mcp", () => handleMcpRequest(request)),
        },
    },
});
