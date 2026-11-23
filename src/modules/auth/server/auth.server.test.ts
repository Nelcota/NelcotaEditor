import assert from "node:assert/strict";
import { describe, test } from "node:test";

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
        test(`keeps ${path} reachable for the admin screens`, async () => {
            const response = await postToAuth(path);

            assert.notEqual(response.status, HTTP_NOT_FOUND);
        });
    }
});
