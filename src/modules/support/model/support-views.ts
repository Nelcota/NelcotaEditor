import type {
    MessageAuthorKind,
    TicketCursor,
    TicketStatus,
} from "#/modules/support/model/support-ticket";
import type { VideoStatus } from "#/modules/video-records/model/video-status";

/** Dates cross the server function boundary as ISO strings. */
export interface TicketMessageView {
    id: string;
    authorKind: MessageAuthorKind;
    authorName: string;
    body: string;
    createdAt: string;
}

export interface TicketVideo {
    id: string;
    title: string;
    status: VideoStatus;
}

export interface CustomerTicketRow {
    id: string;
    number: number;
    subject: string;
    status: TicketStatus;
    hasUnreadReply: boolean;
    lastMessageAt: string;
    videoTitle: string | null;
}

export interface TicketPage<Row> {
    rows: Array<Row>;
    /** Null on the last page. */
    nextCursor: TicketCursor | null;
}

export interface CustomerTicketDetails {
    id: string;
    number: number;
    subject: string;
    status: TicketStatus;
    video: TicketVideo | null;
    messages: Array<TicketMessageView>;
}

export interface StaffTicketRow {
    id: string;
    number: number;
    subject: string;
    status: TicketStatus;
    lastMessageAt: string;
    /** The account's name, or null for a guest ticket from the public form. */
    customerName: string | null;
}

export interface StaffTicketCustomer {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

export interface StaffTicketDetails {
    id: string;
    number: number;
    subject: string;
    status: TicketStatus;
    customer: StaffTicketCustomer | null;
    /** Where a guest's answer goes; null for tickets with an account. */
    contactEmail: string | null;
    video: (TicketVideo & { errorMessage: string | null }) | null;
    messages: Array<TicketMessageView>;
}
