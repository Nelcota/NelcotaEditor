import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "#/db/database.server";
import { appSwitches } from "#/modules/app-switches/app-switches.schema";
import { FeatureTurnedOffError } from "#/modules/app-switches/model/feature-turned-off-error";
import { saveAppSwitch } from "#/modules/app-switches/server/app-switches.server";
import { receiveContactMessage } from "#/modules/support/server/guest-ticket.server";
import { verifyTurnstileToken } from "#/modules/support/server/turnstile-verifier.server";
import { supportTickets } from "#/modules/support/support.schema";

// Runs against the test database from .env.test: bun run test:integration

// Turnstile is Cloudflare's service; the adapter is the one piece replaced here.
vi.mock("#/modules/support/server/turnstile-verifier.server", () => ({
    verifyTurnstileToken: vi.fn(async () => true),
}));

function createGuestEmail(): string {
    return `guest-${randomUUID()}@example.com`;
}

async function countGuestTickets(email: string): Promise<number> {
    const rows = await db
        .select({ id: supportTickets.id })
        .from(supportTickets)
        .where(eq(supportTickets.contactEmail, email));

    return rows.length;
}

beforeEach(async () => {
    await db.delete(appSwitches);
});

afterEach(() => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue(true);
});

afterAll(async () => {
    await db.delete(appSwitches);
    await db.$client.end();
});

describe("receiveContactMessage", () => {
    it("opens a guest ticket for the address", async () => {
        const email = createGuestEmail();

        await receiveContactMessage({
            email,
            message: "Não entro",
            website: "",
            captchaToken: "t",
        });

        expect(await countGuestTickets(email)).toBe(1);
    });

    it("answers as if it worked and stores nothing when the honeypot is filled", async () => {
        const email = createGuestEmail();
        vi.spyOn(process.stdout, "write").mockImplementation(() => true);

        await receiveContactMessage({
            email,
            message: "Spam",
            website: "https://spam.example",
            captchaToken: "t",
        });

        expect(await countGuestTickets(email)).toBe(0);
    });

    it("refuses a message whose security check failed", async () => {
        const email = createGuestEmail();
        vi.mocked(verifyTurnstileToken).mockResolvedValue(false);

        await expect(
            receiveContactMessage({ email, message: "Oi", website: "", captchaToken: "t" }),
        ).rejects.toThrow("A verificação de segurança falhou");
        expect(await countGuestTickets(email)).toBe(0);
    });

    it("refuses a message while support is paused", async () => {
        const email = createGuestEmail();
        await saveAppSwitch({ key: "support", isEnabled: false, adminId: randomUUID() });

        await expect(
            receiveContactMessage({ email, message: "Oi", website: "", captchaToken: "t" }),
        ).rejects.toThrow(FeatureTurnedOffError);
    });
});
