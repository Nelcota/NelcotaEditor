import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { TICKET_TOPIC_LABELS } from "#/modules/support/model/support-ticket";
import { describeTicketStatus, formatTicketNumber } from "#/modules/support/model/ticket-display";
import type { CustomerTicketRow } from "#/modules/support/model/support-views";
import { TicketTopicIcon } from "#/modules/support/ui/components/ticket-topic-icon";
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

const HEAD_CELL_CLASS = "px-4 py-2.5 text-start text-xs font-medium text-muted-foreground";

/** The whole row opens the conversation; the dot and its spoken words mark an unread answer. */
function TicketTableRow({ ticket }: { ticket: CustomerTicketRow }): ReactNode {
    const status = describeTicketStatus(ticket.status);
    const topicLabel = TICKET_TOPIC_LABELS[ticket.topic];

    return (
        <tr className="relative border-t border-border transition-colors hover:bg-accent/40">
            <td className="px-4 py-3 text-meta text-muted-foreground tabular-nums max-md:hidden">
                {formatTicketNumber(ticket.number)}
            </td>
            <td className="px-4 py-3">
                <Link
                    to="/support/$ticketId"
                    params={{ ticketId: ticket.id }}
                    className="flex min-w-0 items-center gap-2 font-semibold outline-none after:absolute after:inset-0 focus-visible:after:ring-4 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                >
                    <span className="[overflow-wrap:anywhere]">{ticket.subject}</span>
                    {ticket.hasUnreadReply === true && (
                        <span className="size-2 shrink-0 rounded-full bg-primary">
                            <span className="sr-only">Resposta nova</span>
                        </span>
                    )}
                </Link>
                <span className="text-meta text-muted-foreground tabular-nums md:hidden">
                    {formatTicketNumber(ticket.number)} · {topicLabel}
                </span>
                <span className="mt-2 flex sm:hidden">
                    <StatusBadge tone={status.tone} label={status.label} />
                </span>
            </td>
            <td className="px-4 py-3 text-meta text-muted-foreground max-md:hidden">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <TicketTopicIcon topic={ticket.topic} className="size-4" />
                    {topicLabel}
                </span>
            </td>
            <td className="px-4 py-3 max-sm:hidden">
                <StatusBadge tone={status.tone} label={status.label} />
            </td>
            <td className="px-4 py-3 text-meta whitespace-nowrap text-muted-foreground tabular-nums max-sm:hidden">
                <time dateTime={ticket.lastMessageAt}>{formatDateTime(ticket.lastMessageAt)}</time>
            </td>
        </tr>
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
                    Não foi possível carregar mais conversas. Tente de novo.
                </p>
            )}
            <Button
                variant="secondary"
                disabled={nextPage.isFetching}
                aria-busy={nextPage.isFetching}
                onClick={() => track(nextPage.onLoadMore())}
            >
                Carregar mais conversas
            </Button>
        </div>
    );
}

interface TicketTableProps {
    tickets: ReadonlyArray<CustomerTicketRow>;
    nextPage: NextTicketPage;
    /** The heading the table is named by. */
    labelledBy: string;
}

/** The person's conversations, newest activity first; columns drop as the panel narrows. */
export function TicketTable({ tickets, nextPage, labelledBy }: TicketTableProps): ReactNode {
    return (
        <div className="grid gap-4">
            <div className="overflow-hidden rounded-2xl border border-card-border bg-card">
                <table aria-labelledby={labelledBy} className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th scope="col" className={`${HEAD_CELL_CLASS} w-20 max-md:hidden`}>
                                Nº
                            </th>
                            <th scope="col" className={HEAD_CELL_CLASS}>
                                Assunto
                            </th>
                            <th scope="col" className={`${HEAD_CELL_CLASS} max-md:hidden`}>
                                Área
                            </th>
                            <th scope="col" className={`${HEAD_CELL_CLASS} max-sm:hidden`}>
                                Situação
                            </th>
                            <th scope="col" className={`${HEAD_CELL_CLASS} max-sm:hidden`}>
                                Atualizada
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map((ticket) => (
                            <TicketTableRow key={ticket.id} ticket={ticket} />
                        ))}
                    </tbody>
                </table>
            </div>
            <LoadMoreTickets nextPage={nextPage} />
        </div>
    );
}
