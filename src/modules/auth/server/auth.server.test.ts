import assert from "node:assert/strict";
import { afterEach, describe, test, vi } from "vitest";

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

// auth.api skips the rate limiter, and both checks fail before Better Auth reads the database.
async function answerSignUp(body: {
    name: string;
    email: string;
    password: string;
}): Promise<{ status: number; body: unknown }> {
    const response = await auth.api.signUpEmail({ body, asResponse: true });

    return { status: response.status, body: await response.json() };
}

const createUserHook = auth.options.databaseHooks?.user?.create?.before;

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

describe("sign-up honeypot", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    // The form sends the honeypot beside the fields Better Auth knows; it ignores unknown ones.
    const botBody = {
        name: "Bot",
        email: "Bot@Example.com",
        password: "senha-do-bot-123",
        website: "https://spam.example",
    };

    const personBody = { ...botBody, website: "" };
    const signUpContext = { path: "/sign-up/email", body: botBody };
    const newUser = {
        id: "user-1",
        email: "bot@example.com",
        emailVerified: false,
        name: "Bot",
        createdAt: new Date("2026-11-23T12:00:00Z"),
        updatedAt: new Date("2026-11-23T12:00:00Z"),
    };

    test("rejects an invalid email the same way with the honeypot filled", async () => {
        const invalidEmail = { email: "not-an-email" };

        const caught = await answerSignUp({ ...botBody, ...invalidEmail });
        const person = await answerSignUp({ ...personBody, ...invalidEmail });

        assert.equal(caught.status, 400);
        assert.deepEqual(caught, person);
    });

    test("rejects a short password the same way with the honeypot filled", async () => {
        const shortPassword = { password: "curta" };

        const caught = await answerSignUp({ ...botBody, ...shortPassword });
        const person = await answerSignUp({ ...personBody, ...shortPassword });

        assert.equal(caught.status, 400);
        assert.deepEqual(caught, person);
    });

    test("lets a sign-up with an empty honeypot through to the database", async () => {
        await assert.rejects(auth.api.signUpEmail({ body: personBody }), /from "user"/);
    });

    test("stops user creation with a 403 when the honeypot is filled", async () => {
        vi.spyOn(process.stdout, "write").mockImplementation(() => true);

        if (createUserHook === undefined) {
            assert.fail("The user create hook is missing");
        }

        await assert.rejects(createUserHook(newUser, signUpContext), { statusCode: 403 });
    });

    test("rejects a blank name with the honeypot filled as it does without it", async () => {
        if (createUserHook === undefined) {
            assert.fail("The user create hook is missing");
        }

        await assert.rejects(createUserHook({ ...newUser, name: " " }, signUpContext), {
            message: "Digite seu nome.",
        });
    });

    test("logs a filled honeypot at warn without the email", async () => {
        const written: Array<string> = [];
        vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
            written.push(String(chunk));
            return true;
        });

        if (createUserHook === undefined) {
            assert.fail("The user create hook is missing");
        }

        await assert.rejects(createUserHook(newUser, signUpContext));

        assert.ok(written.some((line) => line.includes('"message":"Sign-up honeypot filled"')));
        assert.equal(
            written.some((line) => line.includes("bot@example.com")),
            false,
        );
    });
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

        const result = await createHook(newUser, null);

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
