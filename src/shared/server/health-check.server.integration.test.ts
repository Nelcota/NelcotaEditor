import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { checkHealth } from "#/shared/server/health-check.server";

// Runs against the test database from .env.test: bun run test:integration

describe("checkHealth", () => {
    it("reports ok when the database answers", async () => {
        assert.equal(await checkHealth(), "ok");
    });
});
