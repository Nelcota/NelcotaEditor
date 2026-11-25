import type { z } from "zod";
import { db } from "#/db/database.server";
import { assertFeatureEnabled } from "#/modules/app-switches/server/app-switches.server";
import { CONTACT_HONEYPOT_FIELD } from "#/modules/support/model/contact-form";
import type { contactMessageInputSchema } from "#/modules/support/model/contact-form";
import { GUEST_TICKET_SUBJECT } from "#/modules/support/model/support-ticket";
import { appendTicketMessage } from "#/modules/support/server/ticket-messages.server";
import { verifyTurnstileToken } from "#/modules/support/server/turnstile-verifier.server";
import { supportTickets } from "#/modules/support/support.schema";
import { logger } from "#/shared/server/logger.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

type ContactMessage = z.output<typeof contactMessageInputSchema>;

async function insertGuestTicket(email: string, message: string): Promise<void> {
    await db.transaction(async (transaction) => {
        const inserted = await transaction
            .insert(supportTickets)
            .values({ contactEmail: email, subject: GUEST_TICKET_SUBJECT })
            .returning({ id: supportTickets.id });
        const ticketId = inserted[0]?.id;

        if (ticketId === undefined) {
            throw new Error("Inserting a guest support ticket returned no row");
        }

        await appendTicketMessage(transaction, {
            ticketId,
            authorKind: "customer",
            authorId: null,
            body: message,
            status: "open",
            hasUnreadReply: false,
        });
    });
}

/**
 * The public contact form. A filled honeypot answers as if it worked and stores nothing. Whether
 * an account uses the address is never looked up, so the answer reveals nothing about it.
 */
export async function receiveContactMessage(contact: ContactMessage): Promise<void> {
    await assertFeatureEnabled("support");

    if (contact[CONTACT_HONEYPOT_FIELD].trim().length > 0) {
        logger.warn("Contact form honeypot filled");
        return;
    }

    if ((await verifyTurnstileToken(contact.captchaToken)) === false) {
        throw new UserFacingError("A verificação de segurança falhou. Tente de novo.");
    }

    await insertGuestTicket(contact.email, contact.message);
}
