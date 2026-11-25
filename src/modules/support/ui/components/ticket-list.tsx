import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { describeTicketStatus, formatTicketNumber } from "#/modules/support/model/ticket-display";
import type { CustomerTicketRow } from "#/modules/support/model/support-views";
import { Button } from "#/shared/ui/button";
import { formatDateTime } from "#/shared/ui/format";
import { StatusBadge } from "#/shared/ui/status-badge";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

export interface NextTicketPage {
    hasNextPage: boolean;
    isFetching: boolean;
    hasFailed: boolean;
    onLoadMore: () => Promise<void>;
}

function describeRow(ticket: CustomerTicketRow): string {
    const parts = [formatTicketNumber(ticket.number)];

    if (ticket.videoTitle !== null) {
        parts.push(ticket.videoTitle);
    }

    parts.push(formatDateTime(ticket.lastMessageAt));
    return parts.join(" · ");
}

/** The whole row opens the ticket; the dot and its spoken words mark an unread answer. */
function TicketRow({ ticket }: { ticket: CustomerTicketRow }): ReactNode {
    const status = describeTicketStatus(ticket.status);

    return (
        <li className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 transition-colors hover:bg-accent/50 sm:px-5">
            <Link
                to="/support/$ticketId"
                params={{ ticketId: ticket.id }}
                className="flex min-w-0 items-center gap-2 font-semibold outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-4 focus-visible:after:ring-ring"
            >
                {ticket.hasUnreadReply === true && (
                    <span className="size-2 shrink-0 rounded-full bg-primary">
                        <span className="sr-only">Resposta nova:</span>
                    </span>
                )}
                <span className="truncate">{ticket.subject}</span>
            </Link>
            <StatusBadge tone={status.tone} label={status.label} />
            <span className="col-span-2 text-xs text-muted-foreground tabular-nums">
                {describeRow(ticket)}
            </span>
        </li>
    );
}

function LoadMoreTickets({ nextPage }: { nextPage: NextTicketPage }): ReactNode {
    const track = useTrackPromise();

    if (nextPage.hasNextPage === false) {
        return null;
    }

    return (
        <div className="grid justify-items-center gap-2">
            {nextPage.hasFailed === true && (
                <p role="alert" className="text-sm text-destructive">
                    Não foi possível carregar mais tickets. Tente de novo.
                </p>
            )}
            <Button
                variant="secondary"
                disabled={nextPage.isFetching}
                aria-busy={nextPage.isFetching}
                onClick={() => track(nextPage.onLoadMore())}
            >
                Carregar mais tickets
            </Button>
        </div>
    );
}

interface TicketListProps {
    tickets: ReadonlyArray<CustomerTicketRow>;
    nextPage: NextTicketPage;
}

export function TicketList({ tickets, nextPage }: TicketListProps): ReactNode {
    return (
        <div className="grid max-w-3xl gap-4">
            <ul className="divide-y overflow-hidden rounded-2xl border">
                {tickets.map((ticket) => (
                    <TicketRow key={ticket.id} ticket={ticket} />
                ))}
            </ul>
            <LoadMoreTickets nextPage={nextPage} />
        </div>
    );
}
