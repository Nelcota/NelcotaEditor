import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
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

/**
 * Called after the answer is saved, outside its transaction. An account holder gets a link; a
 * guest, who cannot sign in, gets the answer itself.
 */
export async function notifyTicketReply(answered: AnsweredTicket): Promise<void> {
    const { ticketId, replyText } = answered;
    const rows = await db
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
        await enqueueSupportEmail({
            to: accountEmail,
            ticketNumber,
            url: buildTicketUrl(ticketId),
            replyText: null,
        });
        return;
    }

    if (contactEmail === null) {
        throw new Error(`Ticket ${ticketId} has no address to answer`);
    }

    await enqueueSupportEmail({ to: contactEmail, ticketNumber, url: null, replyText });
}
