import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { toHealthResponse } from "#/shared/server/health-response";

describe("toHealthResponse", () => {
    it("answers 200 with only the status when the app is healthy", async () => {
        const response = toHealthResponse("ok");

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { status: "ok" });
    });

    it("answers 503 with only the status when the database is unreachable", async () => {
        const response = toHealthResponse("unavailable");

        assert.equal(response.status, 503);
        assert.deepEqual(await response.json(), { status: "unavailable" });
    });

    it("is never cached, so a stale answer cannot hide an outage", () => {
        const response = toHealthResponse("ok");

        assert.equal(response.headers.get("Cache-Control"), "no-store");
    });
});
