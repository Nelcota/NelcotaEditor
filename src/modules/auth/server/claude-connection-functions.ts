import { createServerFn } from "@tanstack/react-start";
import type { ClaudeConnection } from "#/modules/auth/model/claude-connection";
import { MCP_RESOURCE } from "#/modules/auth/server/auth.server";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import {
    disconnectClaude,
    findClaudeConnectedAt,
} from "#/modules/auth/server/claude-connection.server";
import { logger } from "#/shared/server/logger.server";

export const getClaudeConnection = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<ClaudeConnection> => {
        const connectedAt = await findClaudeConnectedAt(context.user.id);

        return { mcpUrl: MCP_RESOURCE, connectedAt: connectedAt?.toISOString() ?? null };
    });

export const disconnectMyClaude = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<void> => {
        const userId = context.user.id;
        await disconnectClaude(userId);
        logger.info({ userId }, "Claude disconnected");
    });
