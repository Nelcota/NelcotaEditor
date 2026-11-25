import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeEach, describe, test, vi } from "vitest";
import { db } from "#/db/database.server";
import { rateLimit } from "#/modules/auth/auth.schema";
import { auth } from "#/modules/auth/server/auth.server";
import { getEnvironment } from "#/shared/server/env.server";

// Runs against the test database from .env.test: bun run test:integration

const HTTP_UNAUTHORIZED = 401;
const HTTP_TOO_MANY_REQUESTS = 429;
const SIGN_IN_PATH = "/sign-in/email";
const SIGN_IN_LIMIT = 5;
const IP_OCTET_LIMIT = 255;

const authUrl = getEnvironment().BETTER_AUTH_URL ?? "";
const trustedIpHeader = getEnvironment().TRUSTED_PROXY_IP_HEADER ?? "x-real-ip";

/** A fresh address per test, so earlier runs never share its counter. */
function createClientAddress(): string {
    return `10.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}`;
}

async function signIn(clientAddress: string): Promise<Response> {
    const request = new Request(`${authUrl}/api/auth${SIGN_IN_PATH}`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            origin: authUrl,
            [trustedIpHeader]: clientAddress,
        },
        body: JSON.stringify({
            email: `nobody-${randomUUID()}@example.com`,
            password: "senha-errada-123",
        }),
    });

    return auth.handler(request);
}

describe("auth rate limit", () => {
    // Failed sign-ins log through Better Auth; the test output stays readable.
    beforeEach(() => {
        vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    afterAll(async () => {
        await db.$client.end();
    });

    test("answers 429 to the sixth sign-in in a minute from one address", async () => {
        const clientAddress = createClientAddress();
        const statuses: Array<number> = [];

        // One after another: the limit counts requests in the order they arrive.
        for (let attempt = 0; attempt <= SIGN_IN_LIMIT; attempt += 1) {
            const response = await signIn(clientAddress);
            statuses.push(response.status);
        }

        assert.deepEqual(statuses, [
            ...Array.from({ length: SIGN_IN_LIMIT }, () => HTTP_UNAUTHORIZED),
            HTTP_TOO_MANY_REQUESTS,
        ]);
        const counters = await db
            .select({ count: rateLimit.count })
            .from(rateLimit)
            .where(eq(rateLimit.key, `${clientAddress}|${SIGN_IN_PATH}`));
        assert.equal(counters.length, 1);
    });
});
