import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supportQueueQueryOptions } from "#/modules/admin/model/admin-queries";
import { AdminLoadError, AdminLoading } from "#/modules/admin/ui/components/admin-states";
import type { StaffTicketFilter } from "#/modules/support/model/staff-ticket-filter";
import type { StaffTicketRow } from "#/modules/support/model/support-views";
import { describeTicketStatus, formatTicketNumber } from "#/modules/support/model/ticket-display";
import { Button } from "#/shared/ui/button";
import { formatDateTime } from "#/shared/ui/format";
import { StatusBadge } from "#/shared/ui/status-badge";
import { toErrorMessage } from "#/shared/ui/to-error-message";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

const GUEST_LABEL = "Sem conta";
const LOAD_ERROR_MESSAGE = "Confira sua conexão e tente de novo.";

function TicketQueueRow({
    ticket,
    filter,
}: {
    ticket: StaffTicketRow;
    filter: StaffTicketFilter;
}): ReactNode {
    const status = describeTicketStatus(ticket.status);
    const customer = ticket.customerName ?? GUEST_LABEL;

    return (
        <li className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-accent/50">
            <Link
                to="/admin/support/$ticketId"
                params={{ ticketId: ticket.id }}
                search={{ filter }}
                activeProps={{ className: "text-primary-ink" }}
                className="truncate text-sm font-semibold outline-none after:absolute after:inset-0 focus-visible:after:ring-4 focus-visible:after:ring-ring focus-visible:after:ring-inset"
            >
                {ticket.subject}
            </Link>
            <StatusBadge tone={status.tone} label={status.label} />
            <span className="col-span-2 truncate text-xs text-muted-foreground tabular-nums">
                {formatTicketNumber(ticket.number)} · {customer} ·{" "}
                {formatDateTime(ticket.lastMessageAt)}
            </span>
        </li>
    );
}

/** The tickets of one filter, with "Carregar mais"; each row opens the ticket beside the list. */
export function AdminTicketQueue({ filter }: { filter: StaffTicketFilter }): ReactNode {
    const track = useTrackPromise();
    const queueQuery = useInfiniteQuery(supportQueueQueryOptions(filter));
    const pages = queueQuery.data?.pages ?? [];
    const tickets = pages.flatMap((page) => page.rows);

    if (queueQuery.isPending === true) {
        return <AdminLoading label="Carregando a fila do suporte" />;
    }

    if (pages.length === 0) {
        return (
            <AdminLoadError
                title="Não foi possível carregar a fila"
                message={toErrorMessage(queueQuery.error, LOAD_ERROR_MESSAGE)}
                onRetry={() => queueQuery.refetch()}
            />
        );
    }

    if (tickets.length === 0) {
        return <p className="text-sm text-muted-foreground">Nenhum ticket aqui.</p>;
    }

    return (
        <div className="grid content-start gap-3">
            <ul className="divide-y overflow-hidden rounded-2xl border">
                {tickets.map((ticket) => (
                    <TicketQueueRow key={ticket.id} ticket={ticket} filter={filter} />
                ))}
            </ul>
            {queueQuery.hasNextPage === true && (
                <Button
                    variant="secondary"
                    disabled={queueQuery.isFetchingNextPage}
                    aria-busy={queueQuery.isFetchingNextPage}
                    onClick={() => track(queueQuery.fetchNextPage())}
                >
                    Carregar mais tickets
                </Button>
            )}
        </div>
    );
}
