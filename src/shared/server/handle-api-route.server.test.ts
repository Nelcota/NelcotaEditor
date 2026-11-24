import assert from "node:assert/strict";
import { describe, it, vi } from "vitest";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const SHARE_TOKEN = "share-token-123";

function captureStderr(): { read: () => string; restore: () => void } {
    const written: Array<string> = [];
    const writeMock = vi.spyOn(process.stderr, "write").mockImplementation((chunk: unknown) => {
        written.push(String(chunk));
        return true;
    });
    return { read: () => written.join(""), restore: () => writeMock.mockRestore() };
}

describe("handleApiRoute", () => {
    it("logs a failed query without its parameters", async () => {
        const stderr = captureStderr();

        try {
            await handleApiRoute("GET /api/share/$token", async () => {
                throw new DrizzleQueryError("select 1 where token = $1", [SHARE_TOKEN]);
            });
        } finally {
            stderr.restore();
        }

        const output = stderr.read();
        assert.equal(output.includes("GET /api/share/$token"), true);
        assert.equal(output.includes(SHARE_TOKEN), false);
    });
});

describe("handleApiRoute status", () => {
    it("answers a user-facing error as a client error with its message", async () => {
        const response = await handleApiRoute("POST /api/videos/upload", async () => {
            throw new UserFacingError("O vídeo passa de 5 GB. Envie um arquivo menor.");
        });

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
            error: "O vídeo passa de 5 GB. Envie um arquivo menor.",
        });
    });
});
