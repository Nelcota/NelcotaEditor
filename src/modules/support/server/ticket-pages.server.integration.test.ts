import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, test } from "vitest";
import { db } from "#/db/database.server";
import type { TicketCursor } from "#/modules/support/model/support-ticket";
import { ticketCursorSchema } from "#/modules/support/model/support-ticket";
import {
    afterTicketCursor,
    splitTicketPage,
    ticketActivityTime,
} from "#/modules/support/server/ticket-pages.server";
import type { TicketOrder } from "#/modules/support/server/ticket-pages.server";
import { supportTickets } from "#/modules/support/support.schema";

const TICKET_SORT = { oldest: asc, newest: desc };

async function readPage(email: string, order: TicketOrder, cursor: TicketCursor | null) {
    const sort = TICKET_SORT[order];
    const rows = await db
        .select({
            id: supportTickets.id,
            subject: supportTickets.subject,
            lastMessageAt: ticketActivityTime,
        })
        .from(supportTickets)
        .where(and(eq(supportTickets.contactEmail, email), afterTicketCursor(cursor, order)))
        .orderBy(sort(supportTickets.lastMessageAt), sort(supportTickets.id))
        .limit(2);

    return splitTicketPage(rows, 1);
}

describe("ticket cursors", () => {
    afterAll(async () => {
        await db.$client.end();
    });

    test.each([
        { order: "oldest" as const, first: "Earlier", second: "Later" },
        { order: "newest" as const, first: "Later", second: "Earlier" },
    ])("preserves distinct microseconds when ordered $order", async ({ order, first, second }) => {
        const email = `${randomUUID()}@example.test`;

        try {
            await db.insert(supportTickets).values([
                {
                    contactEmail: email,
                    subject: "Earlier",
                    lastMessageAt: sql`'2026-11-25T12:00:00.000100Z'::timestamptz`,
                },
                {
                    contactEmail: email,
                    subject: "Later",
                    lastMessageAt: sql`'2026-11-25T12:00:00.000900Z'::timestamptz`,
                },
            ]);
            const firstPage = await readPage(email, order, null);
            expect(firstPage.pageRows.map((ticket) => ticket.subject)).toEqual([first]);
            expect(ticketCursorSchema.safeParse(firstPage.nextCursor).success).toBe(true);

            const secondPage = await readPage(email, order, firstPage.nextCursor);
            expect(secondPage.pageRows.map((ticket) => ticket.subject)).toEqual([second]);
            expect(secondPage.nextCursor).toBeNull();
        } finally {
            await db.delete(supportTickets).where(eq(supportTickets.contactEmail, email));
        }
    });
});
