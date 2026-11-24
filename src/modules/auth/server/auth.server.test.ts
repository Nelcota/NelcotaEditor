import assert from "node:assert/strict";
import { describe, test } from "vitest";

// auth.server reads the environment when it is imported; nothing here opens a database connection.
process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/test";
process.env.STORAGE_DIR = "test-storage";
process.env.WHISPER_URL = "http://127.0.0.1:1";
process.env.WHISPER_MODEL = "test-model";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.BETTER_AUTH_SECRET = "test-secret-with-at-least-thirty-two-characters";
process.env.TURNSTILE_SITE_KEY = "";
process.env.TURNSTILE_SECRET_KEY = "";

const { auth } = await import("#/modules/auth/server/auth.server");

const HTTP_NOT_FOUND = 404;

async function postToAuth(path: string): Promise<Response> {
    const request = new Request(`http://localhost:3000/api/auth${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: JSON.stringify({}),
    });

    return auth.handler(request);
}

describe("raw auth routes", () => {
    const routesOnlyServerCodeMayUse = [
        "/admin/set-user-password",
        "/admin/create-user",
        "/admin/update-user",
        "/admin/remove-user",
        "/admin/set-role",
        "/admin/ban-user",
        "/admin/unban-user",
        "/admin/list-users",
        "/admin/get-user",
        "/admin/list-user-sessions",
        "/admin/revoke-user-session",
        "/admin/revoke-user-sessions",
        "/admin/has-permission",
        "/verify-password",
    ];

    for (const path of routesOnlyServerCodeMayUse) {
        test(`answers 404 to a browser calling ${path}`, async () => {
            const response = await postToAuth(path);

            assert.equal(response.status, HTTP_NOT_FOUND);
        });
    }

    for (const path of ["/admin/impersonate-user", "/admin/stop-impersonating"]) {
        // Past the disabled paths the rate limiter reads the database, which unit tests do not
        // reach, so this checks the list the 404 above comes from.
        test(`keeps ${path} reachable for the admin screens`, () => {
            const disabledPaths = auth.options.disabledPaths ?? [];

            assert.equal(disabledPaths.includes(path), false);
        });
    }
});

describe("account name hooks", () => {
    const newUser = {
        id: "user-1",
        email: "ana@example.com",
        emailVerified: false,
        name: "  Ana Souza  ",
        createdAt: new Date("2026-11-23T12:00:00Z"),
        updatedAt: new Date("2026-11-23T12:00:00Z"),
    };

    test("stores the trimmed name on sign-up", async () => {
        const createHook = auth.options.databaseHooks?.user?.create?.before;

        if (createHook === undefined) {
            assert.fail("The user create hook is missing");
        }

        const result = await createHook(newUser);

        assert.deepEqual(result, { data: { name: "Ana Souza" } });
    });

    test("stores the trimmed name when the profile is updated", async () => {
        const updateHook = auth.options.databaseHooks?.user?.update?.before;

        if (updateHook === undefined) {
            assert.fail("The user update hook is missing");
        }

        const result = await updateHook({ name: " Ana " });

        assert.deepEqual(result, { data: { name: "Ana" } });
    });
});
