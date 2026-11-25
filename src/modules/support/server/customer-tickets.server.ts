import { and, count, desc, eq, ne, sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "#/db/database.server";
import { assertFeatureEnabled } from "#/modules/app-switches/server/app-switches.server";
import {
    TicketVideoNotFoundError,
    TooManyOpenTicketsError,
} from "#/modules/support/model/support-errors";
import {
    MAX_OPEN_TICKETS_PER_PERSON,
    SUPPORT_PAGE_SIZE,
} from "#/modules/support/model/support-ticket";
import type {
    TicketCursor,
    TicketStatus,
    TicketTopic,
    newTicketSchema,
} from "#/modules/support/model/support-ticket";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import type {
    CustomerTicketDetails,
    CustomerTicketRow,
    TicketPage,
    TicketVideo,
} from "#/modules/support/model/support-views";
import {
    afterTicketCursor,
    splitTicketPage,
    ticketActivityTime,
} from "#/modules/support/server/ticket-pages.server";
import {
    appendTicketMessage,
    listTicketMessages,
} from "#/modules/support/server/ticket-messages.server";
import { supportTickets } from "#/modules/support/support.schema";
import { findOwnedVideoOrNull } from "#/modules/video-records/server/find-owned-video.server";
import { videos } from "#/modules/video-records/video-records.schema";

type NewTicket = z.output<typeof newTicketSchema>;
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface OwnedTicket {
    userId: string;
    ticketId: string;
}

interface OwnedTicketRow {
    id: string;
    number: number;
    subject: string;
    topic: TicketTopic;
    status: TicketStatus;
    hasUnreadReply: boolean;
    lastMessageAt: string;
    createdAt: Date;
    videoId: string | null;
    videoTitle: string | null;
    videoStatus: VideoStatus | null;
}

/** Another person's ticket and a missing one look the same: null, so the page answers 404. */
async function findOwnedTicketRow(owned: OwnedTicket): Promise<OwnedTicketRow | null> {
    const rows = await db
        .select({
            id: supportTickets.id,
            number: supportTickets.number,
            subject: supportTickets.subject,
            topic: supportTickets.topic,
            status: supportTickets.status,
            hasUnreadReply: supportTickets.hasUnreadReply,
            lastMessageAt: ticketActivityTime,
            createdAt: supportTickets.createdAt,
            videoId: videos.id,
            videoTitle: videos.title,
            videoStatus: videos.status,
        })
        .from(supportTickets)
        .leftJoin(videos, eq(videos.id, supportTickets.videoId))
        .where(and(eq(supportTickets.id, owned.ticketId), eq(supportTickets.userId, owned.userId)))
        .limit(1);

    return rows[0] ?? null;
}

async function lockCustomerTickets(transaction: Transaction, userId: string): Promise<void> {
    await transaction.execute(sql`select pg_advisory_xact_lock(hashtext(${`support:${userId}`}))`);
}

async function assertTicketCapacity(transaction: Transaction, userId: string): Promise<void> {
    const openRows = await transaction
        .select({ openCount: count() })
        .from(supportTickets)
        .where(and(eq(supportTickets.userId, userId), ne(supportTickets.status, "closed")));

    if ((openRows[0]?.openCount ?? 0) >= MAX_OPEN_TICKETS_PER_PERSON) {
        throw new TooManyOpenTicketsError();
    }
}

/**
 * Locks the person's tickets for the transaction, so two tabs cannot both pass the open-ticket
 * limit. The video must be theirs; the server never trusts the id the form sent.
 */
export async function openTicket(userId: string, ticket: NewTicket): Promise<string> {
    await assertFeatureEnabled("support");

    if (ticket.videoId !== null && (await findOwnedVideoOrNull(ticket.videoId, userId)) === null) {
        throw new TicketVideoNotFoundError();
    }

    return await db.transaction(async (transaction) => {
        await lockCustomerTickets(transaction, userId);
        await assertTicketCapacity(transaction, userId);

        const inserted = await transaction
            .insert(supportTickets)
            .values({
                userId,
                videoId: ticket.videoId,
                subject: ticket.subject,
                topic: ticket.topic,
            })
            .returning({ id: supportTickets.id });
        const ticketId = inserted[0]?.id;

        if (ticketId === undefined) {
            throw new Error("Inserting a support ticket returned no row");
        }

        await appendTicketMessage(transaction, {
            ticketId,
            authorKind: "customer",
            authorId: userId,
            body: ticket.message,
            status: "open",
            hasUnreadReply: false,
        });
        return ticketId;
    });
}

export async function listCustomerTickets(
    userId: string,
    cursor: TicketCursor | null,
): Promise<TicketPage<CustomerTicketRow>> {
    const rows = await db
        .select({
            id: supportTickets.id,
            number: supportTickets.number,
            subject: supportTickets.subject,
            topic: supportTickets.topic,
            status: supportTickets.status,
            hasUnreadReply: supportTickets.hasUnreadReply,
            lastMessageAt: ticketActivityTime,
            videoTitle: videos.title,
        })
        .from(supportTickets)
        .leftJoin(videos, eq(videos.id, supportTickets.videoId))
        .where(and(eq(supportTickets.userId, userId), afterTicketCursor(cursor, "newest")))
        .orderBy(desc(supportTickets.lastMessageAt), desc(supportTickets.id))
        .limit(SUPPORT_PAGE_SIZE + 1);
    const { pageRows, nextCursor } = splitTicketPage(rows, SUPPORT_PAGE_SIZE);

    return {
        rows: pageRows,
        nextCursor,
    };
}

export async function findCustomerTicket(
    owned: OwnedTicket,
): Promise<CustomerTicketDetails | null> {
    const ticket = await findOwnedTicketRow(owned);

    if (ticket === null) {
        return null;
    }

    const { videoId, videoTitle, videoStatus } = ticket;
    let unreadReplyAt: string | null = null;

    if (ticket.hasUnreadReply === true) {
        unreadReplyAt = ticket.lastMessageAt;
    }

    let video: CustomerTicketDetails["video"] = null;

    if (videoId !== null && videoTitle !== null && videoStatus !== null) {
        video = { id: videoId, title: videoTitle, status: videoStatus };
    }

    return {
        id: ticket.id,
        number: ticket.number,
        subject: ticket.subject,
        topic: ticket.topic,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        unreadReplyAt,
        video,
        messages: await listTicketMessages(ticket.id, "customer"),
    };
}

/** Leave any reply newer than the rendered conversation unread. */
export async function markCustomerTicketRead(
    owned: OwnedTicket,
    lastMessageAt: string,
): Promise<void> {
    await db
        .update(supportTickets)
        .set({ hasUnreadReply: false })
        .where(
            and(
                eq(supportTickets.id, owned.ticketId),
                eq(supportTickets.userId, owned.userId),
                eq(supportTickets.hasUnreadReply, true),
                eq(supportTickets.lastMessageAt, sql`${lastMessageAt}::timestamptz`),
            ),
        );
}

/** Answering puts the ticket back in the admins' queue, a closed one included. */
export async function replyAsCustomer(owned: OwnedTicket, body: string): Promise<boolean> {
    await assertFeatureEnabled("support");
    const { ticketId, userId } = owned;

    return db.transaction(async (transaction) => {
        await lockCustomerTickets(transaction, userId);
        const rows = await transaction
            .select({ status: supportTickets.status })
            .from(supportTickets)
            .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.userId, userId)))
            .for("update");
        const ticket = rows[0];

        if (ticket === undefined) {
            return false;
        }

        if (ticket.status === "closed") {
            await assertTicketCapacity(transaction, userId);
        }

        await appendTicketMessage(transaction, {
            ticketId,
            authorKind: "customer",
            authorId: userId,
            body,
            status: "open",
            hasUnreadReply: false,
        });
        return true;
    });
}

export async function closeCustomerTicket(owned: OwnedTicket): Promise<boolean> {
    const closed = await db
        .update(supportTickets)
        .set({ status: "closed", hasUnreadReply: false })
        .where(and(eq(supportTickets.id, owned.ticketId), eq(supportTickets.userId, owned.userId)))
        .returning({ id: supportTickets.id });

    return closed.length > 0;
}

export async function hasUnreadSupportReply(userId: string): Promise<boolean> {
    const rows = await db
        .select({ id: supportTickets.id })
        .from(supportTickets)
        .where(and(eq(supportTickets.userId, userId), eq(supportTickets.hasUnreadReply, true)))
        .limit(1);

    return rows.length > 0;
}

const MAX_VIDEO_OPTIONS = 50;

/** The person's newest videos, to pick the one the ticket is about. */
export async function listTicketVideoOptions(userId: string): Promise<Array<TicketVideo>> {
    return await db
        .select({ id: videos.id, title: videos.title, status: videos.status })
        .from(videos)
        .where(eq(videos.userId, userId))
        .orderBy(desc(videos.createdAt))
        .limit(MAX_VIDEO_OPTIONS);
}
