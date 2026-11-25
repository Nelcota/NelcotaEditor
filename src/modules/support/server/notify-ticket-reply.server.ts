import { eq } from "drizzle-orm";
import type { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { enqueueSupportEmail } from "#/modules/support/server/support-email-queue.server";
import { supportTickets } from "#/modules/support/support.schema";
import { getEnvironment, InvalidEnvironmentError } from "#/shared/server/env.server";

interface AnsweredTicket {
    ticketId: string;
    replyText: string;
}

function buildTicketUrl(ticketId: string): string {
    const appUrl = getEnvironment().BETTER_AUTH_URL;

    if (appUrl === undefined) {
        throw new InvalidEnvironmentError(["BETTER_AUTH_URL"]);
    }

    return new URL(`/support/${ticketId}`, appUrl).toString();
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** The email job commits with the reply. Account holders get a link, guests the answer itself. */
export async function notifyTicketReply(
    answered: AnsweredTicket,
    transaction: Transaction,
): Promise<void> {
    const { ticketId, replyText } = answered;
    const rows = await transaction
        .select({
            number: supportTickets.number,
            contactEmail: supportTickets.contactEmail,
            accountEmail: user.email,
        })
        .from(supportTickets)
        .leftJoin(user, eq(user.id, supportTickets.userId))
        .where(eq(supportTickets.id, ticketId))
        .limit(1);
    const ticket = rows[0];

    if (ticket === undefined) {
        throw new Error(`Cannot email about missing ticket ${ticketId}`);
    }

    const { number: ticketNumber, accountEmail, contactEmail } = ticket;

    if (accountEmail !== null) {
        await enqueueSupportEmail(
            { to: accountEmail, ticketNumber, url: buildTicketUrl(ticketId), replyText: null },
            transaction,
        );
        return;
    }

    if (contactEmail === null) {
        throw new Error(`Ticket ${ticketId} has no address to answer`);
    }

    await enqueueSupportEmail(
        { to: contactEmail, ticketNumber, url: null, replyText },
        transaction,
    );
}
