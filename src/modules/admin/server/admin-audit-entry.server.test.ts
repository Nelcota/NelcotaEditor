import assert from "node:assert/strict";
import { describe, test } from "vitest";
import {
    toBanDetails,
    toImpersonationStartEntry,
    toImpersonationStopEntry,
} from "#/modules/admin/server/admin-audit-entry.server";

const VISIT_SESSION = { id: "session-1", userId: "customer-1", impersonatedBy: "admin-1" };
const NORMAL_SESSION = { id: "session-2", userId: "customer-1", impersonatedBy: null };
const STOP_PATH = "/admin/stop-impersonating";

describe("toBanDetails", () => {
    test("keeps only the length of the ban reason, never its text", () => {
        const reason = "Ana Souza enviou spam";

        const details = toBanDetails(reason);

        assert.deepEqual(details, { banReasonLength: 21 });
        assert.equal(JSON.stringify(details).includes("Ana"), false);
    });

    test("counts an emoji as one character", () => {
        const details = toBanDetails("spam 🚫");

        assert.deepEqual(details, { banReasonLength: 6 });
    });

    test("records zero for a ban without a reason", () => {
        const details = toBanDetails("");

        assert.deepEqual(details, { banReasonLength: 0 });
    });
});

describe("toImpersonationStartEntry", () => {
    test("records the admin and the customer of a new visit", () => {
        const entry = toImpersonationStartEntry(VISIT_SESSION);

        assert.deepEqual(entry, {
            action: "start-impersonation",
            adminId: "admin-1",
            targetUserId: "customer-1",
            videoId: null,
            details: null,
        });
    });

    test("ignores a normal sign-in", () => {
        const entry = toImpersonationStartEntry(NORMAL_SESSION);

        assert.equal(entry, null);
    });

    test("ignores a session without a user", () => {
        const entry = toImpersonationStartEntry({ impersonatedBy: "admin-1" });

        assert.equal(entry, null);
    });
});

describe("toImpersonationStopEntry", () => {
    test("records a visit ended with the back to my account button", () => {
        const entry = toImpersonationStopEntry(VISIT_SESSION, STOP_PATH);

        assert.deepEqual(entry, {
            action: "stop-impersonation",
            adminId: "admin-1",
            targetUserId: "customer-1",
            videoId: null,
            details: null,
        });
    });

    test("ignores a visit's session deleted by anything else", () => {
        const entry = toImpersonationStopEntry(VISIT_SESSION, "/sign-out");

        assert.equal(entry, null);
    });

    test("ignores a session deleted outside a request", () => {
        const entry = toImpersonationStopEntry(VISIT_SESSION, undefined);

        assert.equal(entry, null);
    });

    test("ignores a normal session deleted on that path", () => {
        const entry = toImpersonationStopEntry(NORMAL_SESSION, STOP_PATH);

        assert.equal(entry, null);
    });
});
