import assert from "node:assert/strict";
import { describe, test } from "vitest";
import { keepImpersonatedSessionExpiry } from "#/modules/auth/server/impersonation-session.server";

const VISIT_ENDS_AT = new Date("2026-11-23T15:00:00Z");
const RENEWED_EXPIRY = new Date("2026-11-30T14:00:00Z");

function contextFor(session: Record<string, unknown>): {
    context: { session: { session: Record<string, unknown> } };
} {
    return { context: { session: { session } } };
}

describe("keepImpersonatedSessionExpiry", () => {
    test("keeps the original expiry when a visit as a customer is refreshed", async () => {
        const context = contextFor({ impersonatedBy: "admin-1", expiresAt: VISIT_ENDS_AT });

        const result = await keepImpersonatedSessionExpiry({ expiresAt: RENEWED_EXPIRY }, context);

        assert.deepEqual(result, { data: { expiresAt: VISIT_ENDS_AT } });
    });

    test("lets a normal session be renewed", async () => {
        const context = contextFor({ impersonatedBy: null, expiresAt: VISIT_ENDS_AT });

        const result = await keepImpersonatedSessionExpiry({ expiresAt: RENEWED_EXPIRY }, context);

        assert.equal(result, undefined);
    });

    test("blocks renewal of an impersonated session with a null expiry", async () => {
        const context = contextFor({ impersonatedBy: "admin-1", expiresAt: null });

        const result = await keepImpersonatedSessionExpiry({ expiresAt: RENEWED_EXPIRY }, context);

        assert.equal(result, false);
    });

    test("accepts a serialized expiry without changing the end of the visit", async () => {
        const context = contextFor({
            impersonatedBy: "admin-1",
            expiresAt: VISIT_ENDS_AT.toISOString(),
        });

        const result = await keepImpersonatedSessionExpiry({ expiresAt: RENEWED_EXPIRY }, context);

        assert.deepEqual(result, { data: { expiresAt: VISIT_ENDS_AT } });
    });

    test("leaves updates without an expiry alone", async () => {
        const context = contextFor({ impersonatedBy: "admin-1", expiresAt: VISIT_ENDS_AT });

        const result = await keepImpersonatedSessionExpiry({}, context);

        assert.equal(result, undefined);
    });

    test("leaves updates made outside a request alone", async () => {
        const result = await keepImpersonatedSessionExpiry({ expiresAt: RENEWED_EXPIRY }, null);

        assert.equal(result, undefined);
    });
});
