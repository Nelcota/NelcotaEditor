import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
    invalidateAdminQueries,
    supportTicketQueryOptions,
} from "#/modules/admin/model/admin-queries";
import {
    closeSupportTicketAsAdmin,
    replyToSupportTicket,
} from "#/modules/admin/server/admin-support-functions";
import { AdminLoadError } from "#/modules/admin/ui/components/admin-states";
import { messageBodySchema } from "#/modules/support/model/support-ticket";
import type { StaffTicketDetails } from "#/modules/support/model/support-views";
import {
    describeTicketStatus,
    formatTicketNumber,
    toThreadMessages,
} from "#/modules/support/model/ticket-display";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { formatDate } from "#/shared/ui/format";
import { MessageThread } from "#/shared/ui/message-thread";
import { ReplyForm } from "#/shared/ui/reply-form";
import { StatusBadge } from "#/shared/ui/status-badge";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const appRoute = getRouteApi("/_app");
const LOAD_ERROR_MESSAGE = "Confira sua conexão e tente de novo.";
const CLOSE_FAILED_MESSAGE = "Não foi possível fechar o ticket. Tente de novo.";

/** Who wrote and what the ticket is about, so nobody has to ask the person again. */
function TicketContext({ ticket }: { ticket: StaffTicketDetails }): ReactNode {
    const { customer, contactEmail, video } = ticket;

    return (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 rounded-2xl border px-4 py-3.5 text-sm">
            <dt className="text-muted-foreground">Conta</dt>
            <dd className="[overflow-wrap:anywhere]">
                {customer !== null && (
                    <Link
                        to="/admin/users/$userId"
                        params={{ userId: customer.id }}
                        className="font-semibold text-primary-ink outline-none hover:underline focus-visible:ring-4 focus-visible:ring-ring"
                    >
                        {customer.name}
                    </Link>
                )}
                {customer !== null &&
                    ` · ${customer.email} · desde ${formatDate(customer.createdAt)}`}
                {customer === null && `Sem conta · ${contactEmail ?? ""}`}
            </dd>
            {video !== null && (
                <>
                    <dt className="text-muted-foreground">Vídeo</dt>
                    <dd className="[overflow-wrap:anywhere]">{video.title}</dd>
                </>
            )}
            {video !== null && video.errorMessage !== null && (
                <>
                    <dt className="text-muted-foreground">Erro</dt>
                    <dd className="[overflow-wrap:anywhere]">{video.errorMessage}</dd>
                </>
            )}
        </dl>
    );
}

function CloseTicketButton({ ticketId }: { ticketId: string }): ReactNode {
    const queryClient = useQueryClient();
    const close = useMutation({
        mutationFn: () => closeSupportTicketAsAdmin({ data: { ticketId } }),
        onSuccess: () => invalidateAdminQueries(queryClient),
    });

    return (
        <>
            {close.isError === true && (
                <FormAlert message={toErrorMessage(close.error, CLOSE_FAILED_MESSAGE)} />
            )}
            <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground"
                disabled={close.isPending}
                aria-busy={close.isPending}
                onClick={() => close.mutate()}
            >
                Fechar ticket
            </Button>
        </>
    );
}

function AdminTicketConversation({ ticket }: { ticket: StaffTicketDetails }): ReactNode {
    const queryClient = useQueryClient();
    const routeContext = appRoute.useRouteContext();
    const adminFirstName = routeContext.user.name.trim().split(" ")[0] ?? "";
    const ticketId = ticket.id;
    const status = describeTicketStatus(ticket.status);

    return (
        <section aria-labelledby="ticket-title" className="grid content-start gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 id="ticket-title" className="text-lg font-semibold text-balance">
                    {ticket.subject}
                    <span className="ms-2 text-sm font-normal text-muted-foreground tabular-nums">
                        {formatTicketNumber(ticket.number)}
                    </span>
                </h2>
                <StatusBadge tone={status.tone} label={status.label} />
            </div>
            <TicketContext ticket={ticket} />
            <MessageThread messages={toThreadMessages(ticket.messages, "staff")} />
            <ReplyForm
                messageSchema={messageBodySchema}
                label={`Responder como ${adminFirstName}`}
                onSend={async (message) => {
                    await replyToSupportTicket({ data: { ticketId, message } });
                    await invalidateAdminQueries(queryClient);
                }}
                secondaryAction={
                    ticket.status !== "closed" && <CloseTicketButton ticketId={ticketId} />
                }
            />
        </section>
    );
}

/** One ticket beside the queue. A missing ticket is a 404 from the route. */
export function AdminTicketScreen({ ticketId }: { ticketId: string }): ReactNode {
    const { data: ticket, error, refetch } = useQuery(supportTicketQueryOptions(ticketId));

    if (ticket !== undefined) {
        return <AdminTicketConversation ticket={ticket} />;
    }

    return (
        <AdminLoadError
            title="Não foi possível carregar o ticket"
            message={toErrorMessage(error, LOAD_ERROR_MESSAGE)}
            onRetry={() => refetch()}
        />
    );
}
