// @vitest-environment happy-dom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ClaudeConnection } from "#/modules/auth/model/claude-connection";
import { useClaudeConnectedAnnouncement } from "#/modules/viral-formats/ui/hooks/use-claude-connected-announcement";

const MCP_URL = "https://editoroculto.com.br/api/mcp";

afterEach(() => {
    cleanup();
});

describe("useClaudeConnectedAnnouncement", () => {
    it("stays quiet when Claude was already connected on arrival", () => {
        const { result } = renderHook(() =>
            useClaudeConnectedAnnouncement({
                mcpUrl: MCP_URL,
                connectedAt: "2026-11-25T12:00:00Z",
            }),
        );

        expect(result.current).toBe("");
    });

    it("announces Claude connecting while the page waits", () => {
        const waiting: ClaudeConnection = { mcpUrl: MCP_URL, connectedAt: null };
        const connected: ClaudeConnection = {
            mcpUrl: MCP_URL,
            connectedAt: "2026-11-25T12:00:00Z",
        };
        const { result, rerender } = renderHook(
            ({ connection }: { connection: ClaudeConnection }) =>
                useClaudeConnectedAnnouncement(connection),
            { initialProps: { connection: waiting } },
        );

        rerender({ connection: connected });

        expect(result.current).toBe("Claude conectado.");
    });
});
