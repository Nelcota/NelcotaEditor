import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeEach, describe, test, vi } from "vitest";
import { z } from "zod";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { AUTH_EMAIL_QUEUE } from "#/modules/auth/server/auth-email-queue.server";
import { auth } from "#/modules/auth/server/auth.server";
import { getEnvironment } from "#/shared/server/env.server";
import { getJobQueue } from "#/shared/server/job-queue.server";

// Runs against the test database from .env.test: bun run test:integration

const HTTP_OK = 200;
const IP_OCTET_LIMIT = 255;

const signUpAnswerSchema = z.object({
    token: z.null(),
    user: z.record(z.string(), z.unknown()),
});

const authUrl = getEnvironment().BETTER_AUTH_URL ?? "";
const trustedIpHeader = getEnvironment().TRUSTED_PROXY_IP_HEADER ?? "x-real-ip";

/** Each sign-up has its own address, so the strict sign-up limit never trips across tests. */
function createClientAddress(): string {
    return `10.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}`;
}

function createAccount(): { name: string; email: string; password: string; website: string } {
    const id = randomUUID();

    return {
        name: "Ana Teste",
        email: `honeypot-${id}@example.com`,
        password: `senha-${id}`,
        website: "",
    };
}

async function signUp(body: object): Promise<Response> {
    const request = new Request(`${authUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            origin: authUrl,
            [trustedIpHeader]: createClientAddress(),
        },
        body: JSON.stringify(body),
    });

    return auth.handler(request);
}

async function readUserKeys(response: Response): Promise<Array<string>> {
    const answer = signUpAnswerSchema.parse(await response.json());

    return Object.keys(answer.user).toSorted();
}

async function countUsers(email: string): Promise<number> {
    const rows = await db.select({ id: user.id }).from(user).where(eq(user.email, email));

    return rows.length;
}

async function countQueuedEmails(to: string): Promise<number> {
    const result = await db.$client.query(
        "select id from pgboss.job where name = $1 and data->>'to' = $2",
        [AUTH_EMAIL_QUEUE, to],
    );

    return result.rows.length;
}

describe("sign-up honeypot", () => {
    // The trap is logged at warn; the test output stays readable.
    beforeEach(() => {
        vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    afterAll(async () => {
        const jobQueue = await getJobQueue();
        await jobQueue.stop({ graceful: false });
        await db.$client.end();
    });

    test("answers a filled honeypot with the same fields as a real sign-up", async () => {
        const person = createAccount();
        const bot = { ...createAccount(), website: "https://spam.example" };

        const personResponse = await signUp(person);
        const botResponse = await signUp(bot);

        assert.equal(botResponse.status, HTTP_OK);
        assert.equal(personResponse.status, HTTP_OK);
        assert.deepEqual(await readUserKeys(botResponse), await readUserKeys(personResponse));
    });

    test("stores nothing and queues no email when the honeypot is filled", async () => {
        const bot = { ...createAccount(), website: "https://spam.example" };

        await signUp(bot);

        assert.equal(await countUsers(bot.email), 0);
        assert.equal(await countQueuedEmails(bot.email), 0);
    });

    test("does not email the owner of a taken address when the honeypot is filled", async () => {
        const owner = createAccount();
        await signUp(owner);

        const response = await signUp({ ...owner, website: "https://spam.example" });

        assert.equal(response.status, HTTP_OK);
        // Only the confirmation link from the owner's own sign-up.
        assert.equal(await countQueuedEmails(owner.email), 1);
    });
});
