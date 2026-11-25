import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import {
    newTicketSchema,
    ticketIdInputSchema,
    myTicketListInputSchema,
    ticketReadSchema,
    ticketReplySchema,
} from "#/modules/support/model/support-ticket";
import type {
    CustomerTicketDetails,
    CustomerTicketRow,
    TicketPage,
    TicketVideo,
} from "#/modules/support/model/support-views";
import {
    closeCustomerTicket,
    findCustomerTicket,
    hasUnreadSupportReply,
    listCustomerTickets,
    listTicketVideoOptions,
    markCustomerTicketRead,
    openTicket,
    replyAsCustomer,
} from "#/modules/support/server/customer-tickets.server";

export const listMyTickets = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(myTicketListInputSchema)
    .handler(async ({ context, data }): Promise<TicketPage<CustomerTicketRow>> =>
        listCustomerTickets(context.user.id, data),
    );

/** Another person's ticket answers 404, the same as one that does not exist. */
export const getMyTicket = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(ticketIdInputSchema)
    .handler(async ({ context, data }): Promise<CustomerTicketDetails> => {
        const ticket = await findCustomerTicket({
            userId: context.user.id,
            ticketId: data.ticketId,
        });

        if (ticket === null) {
            throw notFound();
        }

        return ticket;
    });

export const openSupportTicket = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(newTicketSchema)
    .handler(async ({ context, data }): Promise<{ ticketId: string }> => {
        const ticketId = await openTicket(context.user.id, data);

        return { ticketId };
    });

export const markMyTicketRead = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(ticketReadSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const { ticketId, lastMessageAt } = data;
        await markCustomerTicketRead({ userId: context.user.id, ticketId }, lastMessageAt);
    });

export const replyToMyTicket = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(ticketReplySchema)
    .handler(async ({ context, data }): Promise<void> => {
        const owned = { userId: context.user.id, ticketId: data.ticketId };

        if ((await replyAsCustomer(owned, data.message)) === false) {
            throw notFound();
        }
    });

export const closeMyTicket = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(ticketIdInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const owned = { userId: context.user.id, ticketId: data.ticketId };

        if ((await closeCustomerTicket(owned)) === false) {
            throw notFound();
        }
    });

/** The dot beside Suporte in the sidebar. */
export const getHasSupportReply = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<boolean> => hasUnreadSupportReply(context.user.id));

export const getTicketVideoOptions = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<Array<TicketVideo>> =>
        listTicketVideoOptions(context.user.id),
    );
