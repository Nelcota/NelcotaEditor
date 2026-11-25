import { and, asc, count, desc, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { SUPPORT_PAGE_SIZE } from "#/modules/support/model/support-ticket";
import type { StaffTicketFilter } from "#/modules/support/model/staff-ticket-filter";
import type { TicketCursor } from "#/modules/support/model/support-ticket";
import type {
    StaffTicketDetails,
    StaffTicketRow,
    TicketPage,
} from "#/modules/support/model/support-views";
import { afterTicketCursor, splitTicketPage } from "#/modules/support/server/ticket-pages.server";
import type { TicketOrder } from "#/modules/support/server/ticket-pages.server";
import {
    appendTicketMessage,
    listTicketMessages,
} from "#/modules/support/server/ticket-messages.server";
import { supportTickets } from "#/modules/support/support.schema";
import { videos } from "#/modules/video-records/video-records.schema";

interface StaffListQuery {
    filter: StaffTicketFilter;
    cursor: TicketCursor | null;
}

interface StaffReply {
    adminId: string;
    ticketId: string;
    body: string;
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface FilterRule {
    where: SQL | undefined;
    order: TicketOrder;
    sort: typeof asc;
}

/** Waiting tickets come oldest first, so the longest wait is answered first. */
const FILTER_RULES: Readonly<Record<StaffTicketFilter, FilterRule>> = {
    waiting: { where: eq(supportTickets.status, "open"), order: "oldest", sort: asc },
    answered: { where: eq(supportTickets.status, "answered"), order: "newest", sort: desc },
    closed: { where: eq(supportTickets.status, "closed"), order: "newest", sort: desc },
    all: { where: undefined, order: "newest", sort: desc },
};

export async function listStaffTickets(query: StaffListQuery): Promise<TicketPage<StaffTicketRow>> {
    const rule = FILTER_RULES[query.filter];
    const orderBy = rule.sort;
    const rows = await db
        .select({
            id: supportTickets.id,
            number: supportTickets.number,
            subject: supportTickets.subject,
            status: supportTickets.status,
            lastMessageAt: supportTickets.lastMessageAt,
            customerName: user.name,
        })
        .from(supportTickets)
        .leftJoin(user, eq(user.id, supportTickets.userId))
        .where(and(rule.where, afterTicketCursor(query.cursor, rule.order)))
        .orderBy(orderBy(supportTickets.lastMessageAt), orderBy(supportTickets.id))
        .limit(SUPPORT_PAGE_SIZE + 1);
    const { pageRows, nextCursor } = splitTicketPage(rows, SUPPORT_PAGE_SIZE);

    return {
        rows: pageRows.map((row) => ({ ...row, lastMessageAt: row.lastMessageAt.toISOString() })),
        nextCursor,
    };
}

/** What the Admin folder's badge counts: tickets whose last word is the customer's. */
export async function countWaitingTickets(): Promise<number> {
    const rows = await db
        .select({ waiting: count() })
        .from(supportTickets)
        .where(eq(supportTickets.status, "open"));

    return rows[0]?.waiting ?? 0;
}

export async function findStaffTicket(ticketId: string): Promise<StaffTicketDetails | null> {
    const rows = await db
        .select({
            ticket: supportTickets,
            customerName: user.name,
            customerEmail: user.email,
            customerCreatedAt: user.createdAt,
            videoTitle: videos.title,
            videoStatus: videos.status,
            videoErrorMessage: videos.errorMessage,
        })
        .from(supportTickets)
        .leftJoin(user, eq(user.id, supportTickets.userId))
        .leftJoin(videos, eq(videos.id, supportTickets.videoId))
        .where(eq(supportTickets.id, ticketId))
        .limit(1);
    const row = rows[0];

    if (row === undefined) {
        return null;
    }

    const ticket = row.ticket;
    let customer: StaffTicketDetails["customer"] = null;
    let video: StaffTicketDetails["video"] = null;

    const { customerName, customerEmail, customerCreatedAt } = row;

    if (
        ticket.userId !== null &&
        customerName !== null &&
        customerEmail !== null &&
        customerCreatedAt !== null
    ) {
        customer = {
            id: ticket.userId,
            name: customerName,
            email: customerEmail,
            createdAt: customerCreatedAt.toISOString(),
        };
    }

    if (ticket.videoId !== null && row.videoTitle !== null && row.videoStatus !== null) {
        video = {
            id: ticket.videoId,
            title: row.videoTitle,
            status: row.videoStatus,
            errorMessage: row.videoErrorMessage,
        };
    }

    return {
        id: ticket.id,
        number: ticket.number,
        subject: ticket.subject,
        status: ticket.status,
        customer,
        contactEmail: ticket.contactEmail,
        video,
        messages: await listTicketMessages(ticket.id, "staff"),
    };
}

/** The customer sees the answer marked unread; returns the message id, or null for no ticket. */
export async function replyAsStaff(
    reply: StaffReply,
    transaction: Transaction,
): Promise<string | null> {
    const { adminId, ticketId, body } = reply;
    const rows = await transaction
        .select({ id: supportTickets.id })
        .from(supportTickets)
        .where(eq(supportTickets.id, ticketId))
        .limit(1)
        .for("update");

    if (rows.length === 0) {
        return null;
    }

    return appendTicketMessage(transaction, {
        ticketId,
        authorKind: "staff",
        authorId: adminId,
        body,
        status: "answered",
        hasUnreadReply: true,
    });
}

export async function closeStaffTicket(
    ticketId: string,
    transaction: Transaction,
): Promise<boolean> {
    const closed = await transaction
        .update(supportTickets)
        .set({ status: "closed" })
        .where(eq(supportTickets.id, ticketId))
        .returning({ id: supportTickets.id });

    return closed.length > 0;
}
