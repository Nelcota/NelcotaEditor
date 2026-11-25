import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { db } from "#/db/database.server";
import { appSwitches } from "#/modules/app-switches/app-switches.schema";
import { saveAppSwitch } from "#/modules/app-switches/server/app-switches.server";
import { user } from "#/modules/auth/auth.schema";
import { SIGN_UP_CLOSED_CODE } from "#/modules/auth/model/auth-error-message";
import { auth } from "#/modules/auth/server/auth.server";
import { getEnvironment } from "#/shared/server/env.server";

// Runs against the test database from .env.test: bun run test:integration

const HTTP_OK = 200;
const HTTP_FORBIDDEN = 403;
const IP_OCTET_LIMIT = 255;

const errorBodySchema = z.object({ code: z.string() });

const authUrl = getEnvironment().BETTER_AUTH_URL ?? "";
const trustedIpHeader = getEnvironment().TRUSTED_PROXY_IP_HEADER ?? "x-real-ip";

/** Each test has its own address, so the strict sign-up limit never trips across tests. */
function createClientAddress(): string {
    return `10.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}`;
}

async function signUp(email: string): Promise<Response> {
    const request = new Request(`${authUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            origin: authUrl,
            [trustedIpHeader]: createClientAddress(),
        },
        body: JSON.stringify({ name: "Ana Teste", email, password: `senha-${randomUUID()}` }),
    });

    return auth.handler(request);
}

async function countAccounts(email: string): Promise<number> {
    const rows = await db.select({ id: user.id }).from(user).where(eq(user.email, email));

    return rows.length;
}

describe("sign-up switch", () => {
    beforeEach(async () => {
        await db.delete(appSwitches);
    });

    afterAll(async () => {
        await db.delete(appSwitches);
        await db.$client.end();
    });

    it("refuses a sign-up while sign-up is closed and creates no account", async () => {
        const email = `closed-${randomUUID()}@example.com`;
        await saveAppSwitch({ key: "sign-up", isEnabled: false, adminId: randomUUID() });

        const response = await signUp(email);

        expect(response.status).toBe(HTTP_FORBIDDEN);
        expect(errorBodySchema.parse(await response.json()).code).toBe(SIGN_UP_CLOSED_CODE);
        expect(await countAccounts(email)).toBe(0);
    });

    it("creates the account while sign-up is open", async () => {
        const email = `open-${randomUUID()}@example.com`;

        const response = await signUp(email);

        expect(response.status).toBe(HTTP_OK);
        expect(await countAccounts(email)).toBe(1);
    });
});
