import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "#/db/database.server";
import { closeIdleTickets } from "#/modules/support/server/close-idle-tickets.server";
import { openTicket } from "#/modules/support/server/customer-tickets.server";
import { replyAsStaff } from "#/modules/support/server/staff-tickets.server";
import { createTestAccount } from "#/modules/support/server/support-test-fixtures";
import { supportTickets } from "#/modules/support/support.schema";

// Runs against the test database from .env.test: bun run test:integration

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

async function openAnsweredTicket(): Promise<string> {
    const ticketId = await openTicket(await createTestAccount(), {
        subject: "Ajuda",
        message: "Oi",
        videoId: null,
    });
    await replyAsStaff({ adminId: await createTestAccount(), ticketId, body: "Resposta" });

    return ticketId;
}

async function readStatus(ticketId: string): Promise<string | undefined> {
    const rows = await db
        .select({ status: supportTickets.status })
        .from(supportTickets)
        .where(eq(supportTickets.id, ticketId));

    return rows[0]?.status;
}

afterAll(async () => {
    await db.$client.end();
});

describe("closeIdleTickets", () => {
    it("closes an answered ticket nobody came back to in 14 days", async () => {
        const ticketId = await openAnsweredTicket();

        await closeIdleTickets(new Date(Date.now() + 15 * DAY_MILLISECONDS));

        expect(await readStatus(ticketId)).toBe("closed");
    });

    it("keeps an answered ticket from the last 14 days", async () => {
        const ticketId = await openAnsweredTicket();

        await closeIdleTickets(new Date(Date.now() + 13 * DAY_MILLISECONDS));

        expect(await readStatus(ticketId)).toBe("answered");
    });

    it("never closes a ticket waiting for the team", async () => {
        const ticketId = await openTicket(await createTestAccount(), {
            subject: "Ajuda",
            message: "Oi",
            videoId: null,
        });

        await closeIdleTickets(new Date(Date.now() + 30 * DAY_MILLISECONDS));

        expect(await readStatus(ticketId)).toBe("open");
    });
});
