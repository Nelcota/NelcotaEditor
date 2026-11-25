import { STAFF_FALLBACK_NAME, TICKET_STATUS_LABELS } from "#/modules/support/model/support-ticket";
import type { MessageAuthorKind, TicketStatus } from "#/modules/support/model/support-ticket";
import type { TicketMessageView } from "#/modules/support/model/support-views";
import type { ThreadMessage } from "#/shared/ui/message-thread";
import type { StatusTone } from "#/shared/ui/status-badge";

// Answered reads as done for now: the next move is the person's.
const TICKET_TONES: Readonly<Record<TicketStatus, StatusTone>> = {
    open: "waiting",
    answered: "success",
    closed: "stopped",
};

export function describeTicketStatus(status: TicketStatus): { tone: StatusTone; label: string } {
    return { tone: TICKET_TONES[status], label: TICKET_STATUS_LABELS[status] };
}

export function formatTicketNumber(ticketNumber: number): string {
    return `#${ticketNumber}`;
}

/** Messages as a thread: the side that is not the reader sits on a card. */
export function toThreadMessages(
    messages: ReadonlyArray<TicketMessageView>,
    reader: MessageAuthorKind,
): Array<ThreadMessage> {
    return messages.map((message) => {
        const authorName = message.authorName;
        let authorRole: string | null = null;

        if (message.authorKind === "staff" && authorName !== STAFF_FALLBACK_NAME) {
            authorRole = STAFF_FALLBACK_NAME;
        }

        return {
            id: message.id,
            authorName,
            authorRole,
            body: message.body,
            createdAt: message.createdAt,
            isHighlighted: message.authorKind !== reader,
        };
    });
}
