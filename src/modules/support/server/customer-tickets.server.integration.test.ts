import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "#/db/database.server";
import { appSwitches } from "#/modules/app-switches/app-switches.schema";
import { FeatureTurnedOffError } from "#/modules/app-switches/model/feature-turned-off-error";
import { saveAppSwitch } from "#/modules/app-switches/server/app-switches.server";
import {
    TicketVideoNotFoundError,
    TooManyOpenTicketsError,
} from "#/modules/support/model/support-errors";
import {
    closeCustomerTicket,
    findCustomerTicket,
    hasUnreadSupportReply,
    listCustomerTickets,
    markCustomerTicketRead,
    openTicket,
    replyAsCustomer,
} from "#/modules/support/server/customer-tickets.server";
import { replyAsStaff } from "#/modules/support/server/staff-tickets.server";
import { createTestAccount, createTestVideo } from "#/modules/support/server/support-test-fixtures";

// Runs against the test database from .env.test: bun run test:integration

function openSimpleTicket(userId: string, subject: string = "Vídeo travou"): Promise<string> {
    return openTicket(userId, { subject, message: "Ficou parado em Baixando.", videoId: null });
}

beforeEach(async () => {
    await db.delete(appSwitches);
});

afterAll(async () => {
    await db.delete(appSwitches);
    await db.$client.end();
});

describe("openTicket", () => {
    it("opens a ticket with the first message", async () => {
        const userId = await createTestAccount();

        const ticketId = await openSimpleTicket(userId);

        const ticket = await findCustomerTicket({ userId, ticketId });
        expect(ticket).toMatchObject({ status: "open", subject: "Vídeo travou" });
        expect(ticket?.messages.map((message) => message.body)).toEqual([
            "Ficou parado em Baixando.",
        ]);
    });

    it("links a video of the person's own", async () => {
        const userId = await createTestAccount();
        const videoId = await createTestVideo(userId);

        const ticketId = await openTicket(userId, { subject: "Falhou", message: "Ajuda", videoId });

        const ticket = await findCustomerTicket({ userId, ticketId });
        expect(ticket?.video).toMatchObject({ id: videoId, title: "Live de domingo" });
    });

    it("refuses another person's video", async () => {
        const userId = await createTestAccount();
        const strangerVideoId = await createTestVideo(await createTestAccount());

        await expect(
            openTicket(userId, { subject: "Falhou", message: "Ajuda", videoId: strangerVideoId }),
        ).rejects.toThrow(TicketVideoNotFoundError);
    });

    it("refuses a fourth open ticket", async () => {
        const userId = await createTestAccount();
        await openSimpleTicket(userId, "Primeiro");
        await openSimpleTicket(userId, "Segundo");
        await openSimpleTicket(userId, "Terceiro");

        await expect(openSimpleTicket(userId, "Quarto")).rejects.toThrow(TooManyOpenTicketsError);
    });

    it("opens another ticket once one is closed", async () => {
        const userId = await createTestAccount();
        const firstTicketId = await openSimpleTicket(userId, "Primeiro");
        await openSimpleTicket(userId, "Segundo");
        await openSimpleTicket(userId, "Terceiro");
        await closeCustomerTicket({ userId, ticketId: firstTicketId });

        await expect(openSimpleTicket(userId, "Quarto")).resolves.toEqual(expect.any(String));
    });

    it("refuses a ticket while support is paused", async () => {
        const userId = await createTestAccount();
        await saveAppSwitch({ key: "support", isEnabled: false, adminId: randomUUID() });

        await expect(openSimpleTicket(userId)).rejects.toThrow(FeatureTurnedOffError);
    });
});

describe("another person's ticket", () => {
    it("is not found", async () => {
        const ticketId = await openSimpleTicket(await createTestAccount());
        const strangerId = await createTestAccount();

        expect(await findCustomerTicket({ userId: strangerId, ticketId })).toBeNull();
    });

    it("cannot be answered", async () => {
        const ticketId = await openSimpleTicket(await createTestAccount());
        const strangerId = await createTestAccount();

        expect(await replyAsCustomer({ userId: strangerId, ticketId }, "Oi")).toBe(false);
    });

    it("cannot be closed", async () => {
        const ownerId = await createTestAccount();
        const ticketId = await openSimpleTicket(ownerId);

        expect(await closeCustomerTicket({ userId: await createTestAccount(), ticketId })).toBe(
            false,
        );
        expect((await findCustomerTicket({ userId: ownerId, ticketId }))?.status).toBe("open");
    });

    it("stays out of the person's list", async () => {
        await openSimpleTicket(await createTestAccount());
        const userId = await createTestAccount();

        expect((await listCustomerTickets(userId, null)).rows).toEqual([]);
    });
});

describe("an answer from the team", () => {
    it("marks the ticket unread until the person opens it", async () => {
        const userId = await createTestAccount();
        const ticketId = await openSimpleTicket(userId);
        const adminId = await createTestAccount("Ana");
        await db.transaction((transaction) =>
            replyAsStaff({ adminId, ticketId, body: "Resolvido" }, transaction),
        );

        expect(await hasUnreadSupportReply(userId)).toBe(true);
        const ticket = await findCustomerTicket({ userId, ticketId });
        const unreadReplyAt = ticket?.unreadReplyAt;
        expect(await hasUnreadSupportReply(userId)).toBe(true);

        if (unreadReplyAt === undefined || unreadReplyAt === null) {
            throw new Error("The ticket had no unread reply");
        }

        await db.transaction((transaction) =>
            replyAsStaff({ adminId, ticketId, body: "Complemento" }, transaction),
        );
        await markCustomerTicketRead({ userId, ticketId }, unreadReplyAt);
        expect(await hasUnreadSupportReply(userId)).toBe(true);

        const latest = await findCustomerTicket({ userId, ticketId });
        const latestUnreadReplyAt = latest?.unreadReplyAt;

        if (latestUnreadReplyAt === undefined || latestUnreadReplyAt === null) {
            throw new Error("The ticket had no new unread reply");
        }

        await markCustomerTicketRead({ userId, ticketId }, latestUnreadReplyAt);
        expect(await hasUnreadSupportReply(userId)).toBe(false);
    });

    it("shows the admin by first name", async () => {
        const userId = await createTestAccount();
        const ticketId = await openSimpleTicket(userId);
        const adminId = await createTestAccount("Ana Souza Lima");
        await db.transaction((transaction) =>
            replyAsStaff({ adminId, ticketId, body: "Resolvido" }, transaction),
        );

        const ticket = await findCustomerTicket({ userId, ticketId });

        expect(ticket?.messages.map((message) => message.authorName)).toEqual(["Você", "Ana"]);
    });

    it("is answered back, reopening a closed ticket", async () => {
        const userId = await createTestAccount();
        const ticketId = await openSimpleTicket(userId);
        await closeCustomerTicket({ userId, ticketId });

        await replyAsCustomer({ userId, ticketId }, "Voltou a falhar");

        expect((await findCustomerTicket({ userId, ticketId }))?.status).toBe("open");
    });

    it("enforces the active ticket limit when reopening a closed ticket", async () => {
        const userId = await createTestAccount();
        const ticketId = await openSimpleTicket(userId);
        await closeCustomerTicket({ userId, ticketId });
        await openSimpleTicket(userId, "Primeiro");
        await openSimpleTicket(userId, "Segundo");
        await openSimpleTicket(userId, "Terceiro");

        await expect(replyAsCustomer({ userId, ticketId }, "Voltou a falhar")).rejects.toThrow(
            TooManyOpenTicketsError,
        );
        expect((await findCustomerTicket({ userId, ticketId }))?.status).toBe("closed");
    });
});
