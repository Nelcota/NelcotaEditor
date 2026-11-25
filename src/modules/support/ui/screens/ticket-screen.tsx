import RotateCwIcon from "~icons/lucide/rotate-cw";
import SquarePlayIcon from "~icons/lucide/square-play";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
    invalidateSupportQueries,
    myTicketQueryOptions,
} from "#/modules/support/model/support-queries";
import { messageBodySchema } from "#/modules/support/model/support-ticket";
import type { CustomerTicketDetails } from "#/modules/support/model/support-views";
import {
    describeTicketStatus,
    formatTicketNumber,
    toThreadMessages,
} from "#/modules/support/model/ticket-display";
import { closeMyTicket, replyToMyTicket } from "#/modules/support/server/support-functions";
import { AsyncButton } from "#/shared/ui/async-button";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { FormAlert } from "#/shared/ui/form-alert";
import { BRAND_MASCOT_INDEX, Mascot } from "#/shared/ui/mascot";
import { MessageThread } from "#/shared/ui/message-thread";
import { ReplyForm } from "#/shared/ui/reply-form";
import { StatusBadge } from "#/shared/ui/status-badge";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const CLOSE_FAILED_MESSAGE = "Não foi possível fechar o ticket. Tente de novo.";

function CloseTicketButton({ ticketId }: { ticketId: string }): ReactNode {
    const queryClient = useQueryClient();
    const close = useMutation({
        mutationFn: () => closeMyTicket({ data: { ticketId } }),
        onSuccess: () => invalidateSupportQueries(queryClient),
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

function TicketHeader({ ticket }: { ticket: CustomerTicketDetails }): ReactNode {
    const status = describeTicketStatus(ticket.status);
    const video = ticket.video;

    return (
        <header className="grid max-w-3xl gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-lg font-semibold text-balance">{ticket.subject}</h1>
                <StatusBadge tone={status.tone} label={status.label} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="tabular-nums">Ticket {formatTicketNumber(ticket.number)}</span>
                {video !== null && (
                    <Link
                        to="/videos/$videoId"
                        params={{ videoId: video.id }}
                        className="inline-flex items-center gap-1.5 rounded-lg font-semibold text-primary-ink outline-none hover:underline focus-visible:ring-4 focus-visible:ring-ring [&>svg]:size-4"
                    >
                        <SquarePlayIcon aria-hidden="true" />
                        {video.title}
                    </Link>
                )}
            </div>
        </header>
    );
}

function TicketConversation({ ticket }: { ticket: CustomerTicketDetails }): ReactNode {
    const queryClient = useQueryClient();
    const ticketId = ticket.id;
    let hint: string | undefined = undefined;

    if (ticket.status === "closed") {
        hint = "Responder reabre o ticket.";
    }

    return (
        <div className="grid gap-6">
            <TicketHeader ticket={ticket} />
            <MessageThread messages={toThreadMessages(ticket.messages, "customer")} />
            <ReplyForm
                messageSchema={messageBodySchema}
                label="Responder"
                hint={hint}
                onSend={async (message) => {
                    await replyToMyTicket({ data: { ticketId, message } });
                    await invalidateSupportQueries(queryClient);
                }}
                secondaryAction={
                    ticket.status !== "closed" && <CloseTicketButton ticketId={ticketId} />
                }
            />
        </div>
    );
}

/** One ticket: the conversation and the answer box. A missing ticket is a 404 from the route. */
export function TicketScreen({ ticketId }: { ticketId: string }): ReactNode {
    const { data: ticket, refetch } = useQuery(myTicketQueryOptions(ticketId));

    if (ticket !== undefined) {
        return <TicketConversation ticket={ticket} />;
    }

    return (
        <EmptyState
            art={<Mascot index={BRAND_MASCOT_INDEX} className="size-14" />}
            title="Não foi possível carregar o ticket"
            description="Confira sua conexão e tente de novo."
            action={
                <AsyncButton variant="outline" onAction={() => refetch()}>
                    <RotateCwIcon aria-hidden="true" />
                    Tentar de novo
                </AsyncButton>
            }
        />
    );
}
