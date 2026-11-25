import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { db } from "#/db/database.server";
import { adminAuditLog } from "#/modules/admin/admin.schema";
import * as adminActions from "#/modules/admin/server/record-admin-action.server";
import {
    answerSupportTicket,
    closeSupportTicket,
} from "#/modules/admin/server/support-ticket-actions.server";
import { openTicket } from "#/modules/support/server/customer-tickets.server";
import {
    countWaitingTickets,
    findStaffTicket,
    listStaffTickets,
} from "#/modules/support/server/staff-tickets.server";
import { supportEmailJobSchema } from "#/modules/support/server/support-email-content.server";
import { SUPPORT_EMAIL_QUEUE } from "#/modules/support/server/support-email-queue.server";
import { createTestAccount } from "#/modules/support/server/support-test-fixtures";
import { receiveContactMessage } from "#/modules/support/server/guest-ticket.server";
import { supportTickets } from "#/modules/support/support.schema";

// Runs against the test database from .env.test: bun run test:integration

const queuedJobRowSchema = z.object({ data: supportEmailJobSchema });

async function readQueuedSupportEmails(
    to: string,
): Promise<Array<z.infer<typeof supportEmailJobSchema>>> {
    const result = await db.$client.query(
        "select data from pgboss.job where name = $1 and data->>'to' = $2",
        [SUPPORT_EMAIL_QUEUE, to],
    );

    return result.rows.map((row: unknown) => queuedJobRowSchema.parse(row).data);
}

function openSimpleTicket(userId: string): Promise<string> {
    return openTicket(userId, {
        topic: "clips",
        subject: "Vídeo travou",
        message: "Ajuda",
        videoId: null,
    });
}

afterAll(async () => {
    await db.$client.end();
});

describe("answerSupportTicket", () => {
    it("marks the ticket answered and records the admin", async () => {
        const ticketId = await openSimpleTicket(await createTestAccount());
        const adminId = await createTestAccount("Ana Admin");

        await answerSupportTicket(adminId, { ticketId, message: "Já voltou, tente de novo." });

        expect((await findStaffTicket(ticketId))?.status).toBe("answered");
        const entries = await db
            .select({ details: adminAuditLog.details })
            .from(adminAuditLog)
            .where(
                and(eq(adminAuditLog.adminId, adminId), eq(adminAuditLog.action, "reply-ticket")),
            );
        expect(entries).toEqual([{ details: { ticketId } }]);
    });

    it("emails the account a link without the answer", async () => {
        const customerId = await createTestAccount();
        const ticketId = await openSimpleTicket(customerId);

        await answerSupportTicket(await createTestAccount(), { ticketId, message: "Resposta" });

        const emails = await readQueuedSupportEmails(`support-${customerId}@example.com`);
        expect(emails).toHaveLength(1);
        expect(emails[0]?.url).toContain(`/support/${ticketId}`);
        expect(emails[0]?.replyText).toBeNull();
    });

    it("rolls back the reply and email job if the audit entry fails", async () => {
        const customerId = await createTestAccount();
        const ticketId = await openSimpleTicket(customerId);
        const adminId = await createTestAccount();
        const audit = vi.spyOn(adminActions, "recordAdminAction");
        audit.mockRejectedValueOnce(new Error("Audit store unavailable"));

        try {
            await expect(
                answerSupportTicket(adminId, { ticketId, message: "Resposta" }),
            ).rejects.toThrow("Audit store unavailable");
        } finally {
            audit.mockRestore();
        }

        const ticket = await findStaffTicket(ticketId);
        expect(ticket?.status).toBe("open");
        expect(ticket?.messages).toHaveLength(1);
        expect(await readQueuedSupportEmails(`support-${customerId}@example.com`)).toEqual([]);
    });

    it("emails a guest the answer itself", async () => {
        const email = `guest-${randomUUID()}@example.com`;
        await receiveContactMessage({
            email,
            message: "Não recebo o email",
            website: "",
            captchaToken: null,
        });
        const rows = await db
            .select({ id: supportTickets.id })
            .from(supportTickets)
            .where(eq(supportTickets.contactEmail, email));
        const ticketId = rows[0]?.id ?? "";

        await answerSupportTicket(await createTestAccount(), {
            ticketId,
            message: "Confira o spam.",
        });

        const emails = await readQueuedSupportEmails(email);
        expect(emails).toEqual([
            expect.objectContaining({ url: null, replyText: "Confira o spam." }),
        ]);
    });

    it("answers false for a ticket that does not exist", async () => {
        const adminId = await createTestAccount();

        expect(await answerSupportTicket(adminId, { ticketId: randomUUID(), message: "Oi" })).toBe(
            false,
        );
    });
});

describe("closeSupportTicket", () => {
    it("closes the ticket and records the admin", async () => {
        const ticketId = await openSimpleTicket(await createTestAccount());
        const adminId = await createTestAccount();

        await closeSupportTicket(adminId, ticketId);

        expect((await findStaffTicket(ticketId))?.status).toBe("closed");
    });
});

describe("the waiting queue", () => {
    it("counts and lists tickets whose last word is the customer's, oldest first", async () => {
        await db.delete(supportTickets);
        const olderTicketId = await openSimpleTicket(await createTestAccount());
        const newerTicketId = await openSimpleTicket(await createTestAccount());
        const answeredTicketId = await openSimpleTicket(await createTestAccount());
        await answerSupportTicket(await createTestAccount(), {
            ticketId: answeredTicketId,
            message: "Pronto",
        });

        const page = await listStaffTickets({ filter: "waiting", cursor: null });

        expect(await countWaitingTickets()).toBe(2);
        expect(page.rows.map((row) => row.id)).toEqual([olderTicketId, newerTicketId]);
    });
});
