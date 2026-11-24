import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import { afterAll, describe, test } from "vitest";
import { z } from "zod";
import { db } from "#/db/database.server";
import { AUTH_EMAIL_QUEUE } from "#/modules/auth/server/auth-email-queue.server";
import { auth } from "#/modules/auth/server/auth.server";
import { authEmailJobSchema } from "#/modules/auth/server/auth-email-content.server";
import type { AuthEmailJob } from "#/modules/auth/server/auth-email-content.server";
import { getEnvironment } from "#/shared/server/env.server";
import { getJobQueue } from "#/shared/server/job-queue.server";

// Runs against the test database from .env.test: bun run test:integration

const HTTP_OK = 200;
const HTTP_FORBIDDEN = 403;
const HTTP_FOUND = 302;
const IP_OCTET_LIMIT = 255;
const SESSION_COOKIE = "better-auth.session_token";

const queuedJobRowSchema = z.object({ data: authEmailJobSchema });
const errorBodySchema = z.object({ code: z.string() });

const authUrl = getEnvironment().BETTER_AUTH_URL ?? "";
const trustedIpHeader = getEnvironment().TRUSTED_PROXY_IP_HEADER ?? "x-real-ip";

/** Each test has its own address, so the strict sign-up limit never trips across tests. */
function createClientAddress(): string {
    return `10.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}`;
}

function createAccount(): { name: string; email: string; password: string } {
    const id = randomUUID();

    return { name: "Ana Teste", email: `auth-${id}@example.com`, password: `senha-${id}` };
}

async function postToAuth(path: string, body: object, clientAddress: string): Promise<Response> {
    const request = new Request(`${authUrl}/api/auth${path}`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            origin: authUrl,
            [trustedIpHeader]: clientAddress,
        },
        body: JSON.stringify(body),
    });

    return auth.handler(request);
}

async function readQueuedEmails(to: string): Promise<Array<AuthEmailJob>> {
    const result = await db.$client.query(
        "select data from pgboss.job where name = $1 and data->>'to' = $2 order by created_on",
        [AUTH_EMAIL_QUEUE, to],
    );

    return result.rows.map((row: unknown) => queuedJobRowSchema.parse(row).data);
}

function hasSessionCookie(response: Response): boolean {
    return response.headers.getSetCookie().some((cookie) => cookie.startsWith(SESSION_COOKIE));
}

async function readErrorCode(response: Response): Promise<string> {
    return errorBodySchema.parse(await response.json()).code;
}

describe("auth emails", () => {
    afterAll(async () => {
        const jobQueue = await getJobQueue();
        await jobQueue.stop({ graceful: false });
        await db.$client.end();
    });

    test("signs up without a session and queues a confirmation link", async () => {
        const account = createAccount();

        const response = await postToAuth("/sign-up/email", account, createClientAddress());

        assert.equal(response.status, HTTP_OK);
        assert.equal(hasSessionCookie(response), false);
        const emails = await readQueuedEmails(account.email);
        assert.deepEqual(
            emails.map((email) => email.kind),
            ["verify-email"],
        );
        assert.match(emails[0]?.url ?? "", /\/api\/auth\/verify-email\?token=/);
    });

    test("answers a taken email like a new one and tells the owner instead", async () => {
        const account = createAccount();
        await postToAuth("/sign-up/email", account, createClientAddress());

        const response = await postToAuth("/sign-up/email", account, createClientAddress());

        assert.equal(response.status, HTTP_OK);
        const kinds = (await readQueuedEmails(account.email)).map((email) => email.kind);
        assert.deepEqual(kinds, ["verify-email", "existing-account"]);
    });

    test("refuses to sign in before the email is confirmed and sends a new link", async () => {
        const account = createAccount();
        await postToAuth("/sign-up/email", account, createClientAddress());

        const response = await postToAuth("/sign-in/email", account, createClientAddress());

        assert.equal(response.status, HTTP_FORBIDDEN);
        assert.equal(await readErrorCode(response), "EMAIL_NOT_VERIFIED");
        const kinds = (await readQueuedEmails(account.email)).map((email) => email.kind);
        assert.deepEqual(kinds, ["verify-email", "verify-email"]);
    });

    test("signs the person in when they follow the confirmation link", async () => {
        const account = createAccount();
        await postToAuth(
            "/sign-up/email",
            { ...account, callbackURL: "/sign-in" },
            createClientAddress(),
        );
        const [confirmation] = await readQueuedEmails(account.email);

        if (confirmation === undefined) {
            throw new Error("No confirmation email was queued");
        }

        const response = await auth.handler(new Request(confirmation.url));

        assert.equal(response.status, HTTP_FOUND);
        assert.equal(hasSessionCookie(response), true);
        const signIn = await postToAuth("/sign-in/email", account, createClientAddress());
        assert.equal(signIn.status, HTTP_OK);
    });

    test("queues a reset link for an account and nothing for an unknown email", async () => {
        const account = createAccount();
        const unknownEmail = `nobody-${randomUUID()}@example.com`;
        await postToAuth("/sign-up/email", account, createClientAddress());

        const known = await postToAuth(
            "/request-password-reset",
            { email: account.email, redirectTo: "/reset-password" },
            createClientAddress(),
        );
        const unknown = await postToAuth(
            "/request-password-reset",
            { email: unknownEmail, redirectTo: "/reset-password" },
            createClientAddress(),
        );

        assert.equal(known.status, HTTP_OK);
        assert.equal(unknown.status, HTTP_OK);
        const kinds = (await readQueuedEmails(account.email)).map((email) => email.kind);
        assert.deepEqual(kinds, ["verify-email", "reset-password"]);
        assert.deepEqual(await readQueuedEmails(unknownEmail), []);
    });
});
