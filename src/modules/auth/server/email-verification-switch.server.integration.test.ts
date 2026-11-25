import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "#/db/database.server";
import { appSwitches } from "#/modules/app-switches/app-switches.schema";
import { saveAppSwitch } from "#/modules/app-switches/server/app-switches.server";
import { USER_ROLE, user } from "#/modules/auth/auth.schema";
import { MAX_NAME_LENGTH } from "#/modules/auth/model/auth-forms";
import { auth } from "#/modules/auth/server/auth.server";
import { getEnvironment } from "#/shared/server/env.server";

// Runs against the test database from .env.test: bun run test:integration

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_FORBIDDEN = 403;
const IP_OCTET_LIMIT = 255;

const authUrl = getEnvironment().BETTER_AUTH_URL ?? "";
const trustedIpHeader = getEnvironment().TRUSTED_PROXY_IP_HEADER ?? "x-real-ip";

interface Credentials {
    email: string;
    password: string;
}

/** Each request has its own address, so the strict auth limits never trip across tests. */
function createClientAddress(): string {
    return `10.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}.${randomInt(IP_OCTET_LIMIT)}`;
}

async function postToAuth(path: string, body: object): Promise<Response> {
    const request = new Request(`${authUrl}/api/auth${path}`, {
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

function createCredentials(): Credentials {
    const id = randomUUID();

    return { email: `verification-${id}@example.com`, password: `senha-${id}` };
}

async function readEmailVerified(email: string): Promise<boolean | undefined> {
    const rows = await db
        .select({ emailVerified: user.emailVerified })
        .from(user)
        .where(eq(user.email, email));

    return rows[0]?.emailVerified;
}

describe("email-verification switch", () => {
    beforeEach(async () => {
        await db.delete(appSwitches);
    });

    afterAll(async () => {
        await db.delete(appSwitches);
        await db.$client.end();
    });

    it("lets a new account sign in right away while the switch is off", async () => {
        const credentials = createCredentials();
        await saveAppSwitch({ key: "email-verification", isEnabled: false, adminId: randomUUID() });
        await postToAuth("/sign-up/email", { name: "Ana Teste", ...credentials });

        const response = await postToAuth("/sign-in/email", credentials);

        expect(response.status).toBe(HTTP_OK);
        expect(await readEmailVerified(credentials.email)).toBe(true);
    });

    it("keeps a new account closed until confirmed while the switch is on", async () => {
        const credentials = createCredentials();
        await postToAuth("/sign-up/email", { name: "Ana Teste", ...credentials });

        const response = await postToAuth("/sign-in/email", credentials);

        expect(response.status).toBe(HTTP_FORBIDDEN);
        expect(await readEmailVerified(credentials.email)).toBe(false);
    });

    it("answers a taken email the same way while the switch is off", async () => {
        const credentials = createCredentials();
        await saveAppSwitch({ key: "email-verification", isEnabled: false, adminId: randomUUID() });
        const body = { name: "  Ana Teste  ", ...credentials };
        const first = await postToAuth("/sign-up/email", body);
        const duplicate = await postToAuth("/sign-up/email", body);
        const publicResponse = {
            token: null,
            user: {
                id: expect.any(String),
                email: credentials.email,
                name: "Ana Teste",
                emailVerified: false,
                image: null,
                role: USER_ROLE,
                banned: false,
                banReason: null,
                banExpires: null,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            },
        };

        expect(first.status).toBe(HTTP_OK);
        expect(duplicate.status).toBe(HTTP_OK);
        expect(await first.json()).toEqual(publicResponse);
        expect(await duplicate.json()).toEqual(publicResponse);
    });

    it("validates the name before checking whether the email is taken", async () => {
        const existing = createCredentials();
        await postToAuth("/sign-up/email", { name: "Ana Teste", ...existing });
        const name = "A".repeat(MAX_NAME_LENGTH + 1);
        const fresh = await postToAuth("/sign-up/email", { name, ...createCredentials() });
        const duplicate = await postToAuth("/sign-up/email", { name, ...existing });

        expect(fresh.status).toBe(HTTP_BAD_REQUEST);
        expect(duplicate.status).toBe(HTTP_BAD_REQUEST);
        expect(await duplicate.json()).toEqual(await fresh.json());
    });
});
