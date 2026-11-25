import { isNotFound, notFound } from "@tanstack/react-router";
import { ticketIdInputSchema } from "#/modules/support/model/support-ticket";

/**
 * Runs a ticket page's load. A malformed id or a ticket that is missing (or someone else's)
 * becomes the 404 page; any other failure stays on the query, where the screen shows it.
 */
export async function loadTicket(ticketId: string, load: () => Promise<unknown>): Promise<void> {
    if (ticketIdInputSchema.safeParse({ ticketId }).success === false) {
        throw notFound();
    }

    try {
        await load();
    } catch (error) {
        if (isNotFound(error) === true) {
            throw error;
        }
    }
}
