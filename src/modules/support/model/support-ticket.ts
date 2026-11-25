import { z } from "zod";

export const TICKET_STATUSES = ["open", "answered", "closed"] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const MESSAGE_AUTHOR_KINDS = ["customer", "staff"] as const;

export type MessageAuthorKind = (typeof MESSAGE_AUTHOR_KINDS)[number];

export const MAX_SUBJECT_LENGTH = 120;
export const MAX_MESSAGE_LENGTH = 5000;
/** One person cannot fill the queue; closing one lets them open another. */
export const MAX_OPEN_TICKETS_PER_PERSON = 3;
/** An answered ticket nobody came back to closes itself after this long. */
export const ANSWERED_TICKET_IDLE_DAYS = 14;
export const SUPPORT_PAGE_SIZE = 25;
/** What a guest ticket from the public form is called; guests write no subject. */
export const GUEST_TICKET_SUBJECT = "Contato sem conta";
/** Shown to customers for an admin whose account is gone. */
export const STAFF_FALLBACK_NAME = "Suporte Editor Oculto";

export const TICKET_STATUS_LABELS: Readonly<Record<TicketStatus, string>> = {
    open: "Aberto",
    answered: "Respondido",
    closed: "Fechado",
};

const subjectSchema = z
    .string()
    .trim()
    .min(1, "Escreva um assunto.")
    .max(MAX_SUBJECT_LENGTH, `Use até ${MAX_SUBJECT_LENGTH} caracteres.`);

export const messageBodySchema = z
    .string()
    .trim()
    .min(1, "Escreva a mensagem.")
    .max(MAX_MESSAGE_LENGTH, `Use até ${MAX_MESSAGE_LENGTH} caracteres.`);

/** The form sends "" for no video; the server only ever sees a uuid or null. */
export const newTicketSchema = z.object({
    subject: subjectSchema,
    message: messageBodySchema,
    videoId: z.union([z.uuid(), z.literal("").transform(() => null)]).nullable(),
});

export type NewTicketInput = z.input<typeof newTicketSchema>;

export const ticketIdInputSchema = z.object({ ticketId: z.uuid() });
export const ticketReadSchema = ticketIdInputSchema.extend({ lastMessageAt: z.iso.datetime() });

export const ticketReplySchema = z.object({
    ticketId: z.uuid(),
    message: messageBodySchema,
});

export type TicketReplyInput = z.infer<typeof ticketReplySchema>;

/** Keyset cursor: the last row's activity time and id, so new messages never shift a page. */
export const ticketCursorSchema = z.object({
    lastMessageAt: z.iso.datetime(),
    id: z.uuid(),
});

export type TicketCursor = z.infer<typeof ticketCursorSchema>;

export const ticketListInputSchema = z.object({ cursor: ticketCursorSchema.nullable() });

/** "Relatar problema" on a failed video brings its id; anything else in the URL is ignored. */
export const newTicketSearchSchema = z.object({ videoId: z.uuid().optional().catch(undefined) });
