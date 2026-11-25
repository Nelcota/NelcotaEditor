import { asc, eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { STAFF_FALLBACK_NAME } from "#/modules/support/model/support-ticket";
import type { MessageAuthorKind, TicketStatus } from "#/modules/support/model/support-ticket";
import type { TicketMessageView } from "#/modules/support/model/support-views";
import { supportMessages, supportTickets } from "#/modules/support/support.schema";

/** A thread longer than this is not a support conversation any more; the newest stay hidden. */
const MAX_THREAD_MESSAGES = 500;
const GUEST_NAME = "Visitante";
const OWN_MESSAGE_NAME = "Você";
const WHITESPACE = /\s+/;

export type ThreadReader = "customer" | "staff";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface NewMessage {
    ticketId: string;
    authorKind: MessageAuthorKind;
    authorId: string | null;
    body: string;
    /** The ticket's state once this message is in. */
    status: TicketStatus;
    hasUnreadReply: boolean;
}

/** Customers see an admin's first name only; admins see everyone's full name. */
function nameAuthor(
    reader: ThreadReader,
    authorKind: MessageAuthorKind,
    accountName: string | null,
): string {
    if (reader === "customer" && authorKind === "customer") {
        return OWN_MESSAGE_NAME;
    }

    if (accountName === null && authorKind === "staff") {
        return STAFF_FALLBACK_NAME;
    }

    if (accountName === null) {
        return GUEST_NAME;
    }

    if (reader === "customer") {
        return accountName.trim().split(WHITESPACE)[0] ?? STAFF_FALLBACK_NAME;
    }

    return accountName;
}

export async function listTicketMessages(
    ticketId: string,
    reader: ThreadReader,
): Promise<Array<TicketMessageView>> {
    const rows = await db
        .select({
            id: supportMessages.id,
            authorKind: supportMessages.authorKind,
            body: supportMessages.body,
            createdAt: supportMessages.createdAt,
            accountName: user.name,
        })
        .from(supportMessages)
        // Left join: an admin who answered may have been deleted since.
        .leftJoin(user, eq(user.id, supportMessages.authorId))
        .where(eq(supportMessages.ticketId, ticketId))
        .orderBy(asc(supportMessages.createdAt), asc(supportMessages.id))
        .limit(MAX_THREAD_MESSAGES);

    return rows.map((row) => ({
        id: row.id,
        authorKind: row.authorKind,
        authorName: nameAuthor(reader, row.authorKind, row.accountName),
        body: row.body,
        createdAt: row.createdAt.toISOString(),
    }));
}

/** Adds the message and moves the ticket in the same transaction; returns the message id. */
export async function appendTicketMessage(
    transaction: Transaction,
    message: NewMessage,
): Promise<string> {
    const { ticketId, authorKind, authorId, body, status, hasUnreadReply } = message;
    // Set here, in milliseconds, so the list cursor (a JavaScript date) matches it exactly.
    const now = new Date();

    await transaction
        .update(supportTickets)
        .set({ status, hasUnreadReply, lastMessageAt: now })
        .where(eq(supportTickets.id, ticketId));
    const inserted = await transaction
        .insert(supportMessages)
        .values({ ticketId, authorKind, authorId, body, createdAt: now })
        .returning({ id: supportMessages.id });
    const messageId = inserted[0]?.id;

    if (messageId === undefined) {
        throw new Error(`Inserting a message into ticket ${ticketId} returned no row`);
    }

    return messageId;
}
