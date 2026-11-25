import { z } from "zod";
import { ticketCursorSchema } from "#/modules/support/model/support-ticket";

export const STAFF_TICKET_FILTERS = ["waiting", "answered", "closed", "all"] as const;

export type StaffTicketFilter = (typeof STAFF_TICKET_FILTERS)[number];

export const DEFAULT_STAFF_TICKET_FILTER: StaffTicketFilter = "waiting";

export const STAFF_TICKET_FILTER_LABELS: Readonly<Record<StaffTicketFilter, string>> = {
    waiting: "Esperando resposta",
    answered: "Respondidos",
    closed: "Fechados",
    all: "Todos",
};

export const staffTicketListInputSchema = z.object({
    filter: z.enum(STAFF_TICKET_FILTERS),
    cursor: ticketCursorSchema.nullable(),
});

export type StaffTicketListInput = z.infer<typeof staffTicketListInputSchema>;

/** The filter lives in the URL; anything odd falls back to the waiting queue. */
export const adminSupportSearchSchema = z.object({
    filter: z.enum(STAFF_TICKET_FILTERS).optional().catch(undefined),
});

export type AdminSupportSearch = z.infer<typeof adminSupportSearchSchema>;
