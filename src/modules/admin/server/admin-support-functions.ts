import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware } from "#/modules/admin/server/admin-middleware";
import {
    answerSupportTicket,
    closeSupportTicket,
} from "#/modules/admin/server/support-ticket-actions.server";
import { staffTicketListInputSchema } from "#/modules/support/model/staff-ticket-filter";
import { ticketIdInputSchema, ticketReplySchema } from "#/modules/support/model/support-ticket";
import type {
    StaffTicketDetails,
    StaffTicketRow,
    TicketPage,
} from "#/modules/support/model/support-views";
import {
    countWaitingTickets,
    findStaffTicket,
    listStaffTickets,
} from "#/modules/support/server/staff-tickets.server";

export const getSupportQueue = createServerFn({ method: "GET" })
    .middleware([adminMiddleware])
    .validator(staffTicketListInputSchema)
    .handler(async ({ data }): Promise<TicketPage<StaffTicketRow>> => listStaffTickets(data));

export const countSupportWaiting = createServerFn({ method: "GET" })
    .middleware([adminMiddleware])
    .handler(async (): Promise<number> => countWaitingTickets());

export const getSupportTicket = createServerFn({ method: "GET" })
    .middleware([adminMiddleware])
    .validator(ticketIdInputSchema)
    .handler(async ({ data }): Promise<StaffTicketDetails> => {
        const ticket = await findStaffTicket(data.ticketId);

        if (ticket === null) {
            throw notFound();
        }

        return ticket;
    });

export const replyToSupportTicket = createServerFn({ method: "POST" })
    .middleware([adminMiddleware])
    .validator(ticketReplySchema)
    .handler(async ({ context, data }): Promise<void> => {
        if ((await answerSupportTicket(context.admin.id, data)) === false) {
            throw notFound();
        }
    });

export const closeSupportTicketAsAdmin = createServerFn({ method: "POST" })
    .middleware([adminMiddleware])
    .validator(ticketIdInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        if ((await closeSupportTicket(context.admin.id, data.ticketId)) === false) {
            throw notFound();
        }
    });
