import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

const SHARE_TOKEN = "share-token-123";

function captureStderr(): { read: () => string; restore: () => void } {
    const written: Array<string> = [];
    const writeMock = mock.method(process.stderr, "write", (chunk: unknown) => {
        written.push(String(chunk));
        return true;
    });
    return { read: () => written.join(""), restore: () => writeMock.mock.restore() };
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
