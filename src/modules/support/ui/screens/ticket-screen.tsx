import CheckIcon from "~icons/lucide/check";
import ChevronLeftIcon from "~icons/lucide/chevron-left";
import RotateCwIcon from "~icons/lucide/rotate-cw";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import type { ReactNode } from "react";
import {
    invalidateSupportQueries,
    myTicketQueryOptions,
} from "#/modules/support/model/support-queries";
import { TICKET_TOPIC_LABELS } from "#/modules/support/model/support-ticket";
import type { CustomerTicketDetails } from "#/modules/support/model/support-views";
import { formatTicketNumber } from "#/modules/support/model/ticket-display";
import {
    closeMyTicket,
    markMyTicketRead,
    replyToMyTicket,
} from "#/modules/support/server/support-functions";
import { TicketReplyCard } from "#/modules/support/ui/components/ticket-reply-card";
import { TicketStatusPill } from "#/modules/support/ui/components/ticket-status-pill";
import { TicketTimeline } from "#/modules/support/ui/components/ticket-timeline";
import { TicketTopicIcon } from "#/modules/support/ui/components/ticket-topic-icon";
import { AsyncButton } from "#/shared/ui/async-button";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { FormAlert } from "#/shared/ui/form-alert";
import { formatDateTime } from "#/shared/ui/format";
import { BRAND_MASCOT_INDEX, Mascot } from "#/shared/ui/mascot";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const CLOSE_FAILED_MESSAGE = "Não foi possível marcar como resolvida. Tente de novo.";

function ResolveButton({ ticketId }: { ticketId: string }): ReactNode {
    const queryClient = useQueryClient();
    const close = useMutation({
        mutationFn: () => closeMyTicket({ data: { ticketId } }),
        onSuccess: () => invalidateSupportQueries(queryClient),
    });

    return (
        <>
            <Button
                type="button"
                variant="secondary"
                disabled={close.isPending}
                aria-busy={close.isPending}
                onClick={() => close.mutate()}
            >
                <CheckIcon aria-hidden="true" />
                Meu problema foi resolvido
            </Button>
            {close.isError === true && (
                <FormAlert message={toErrorMessage(close.error, CLOSE_FAILED_MESSAGE)} />
            )}
        </>
    );
}

function TicketMeta({ ticket }: { ticket: CustomerTicketDetails }): ReactNode {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-meta text-muted-foreground">
            <span className="grid size-8 place-items-center rounded-lg bg-secondary text-foreground [&>svg]:size-4">
                <TicketTopicIcon topic={ticket.topic} />
            </span>
            <span className="tabular-nums">
                {formatTicketNumber(ticket.number)} · {TICKET_TOPIC_LABELS[ticket.topic]} · aberta
                em {formatDateTime(ticket.createdAt)}
            </span>
        </div>
    );
}

function TicketHeader({ ticket }: { ticket: CustomerTicketDetails }): ReactNode {
    return (
        <header className="grid gap-3">
            <Link
                to="/support"
                className="inline-flex items-center gap-1 justify-self-start rounded-md text-meta text-muted-foreground outline-none hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring [&>svg]:size-4"
            >
                <ChevronLeftIcon aria-hidden="true" />
                Suas conversas
            </Link>
            <TicketMeta ticket={ticket} />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-title font-extrabold tracking-[-0.02em] text-balance [overflow-wrap:anywhere]">
                    {ticket.subject}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                    <TicketStatusPill status={ticket.status} />
                    {ticket.status !== "closed" && <ResolveButton ticketId={ticket.id} />}
                </div>
            </div>
        </header>
    );
}

function TicketConversation({ ticket }: { ticket: CustomerTicketDetails }): ReactNode {
    const queryClient = useQueryClient();
    const { id: ticketId, unreadReplyAt } = ticket;
    const { mutate: markRead } = useMutation({
        mutationFn: (lastMessageAt: string) =>
            markMyTicketRead({ data: { ticketId, lastMessageAt } }),
        onSuccess: () => invalidateSupportQueries(queryClient),
    });

    useEffect(() => {
        if (unreadReplyAt !== null) {
            markRead(unreadReplyAt);
        }
    }, [markRead, unreadReplyAt]);

    let hint = "A resposta também chega por e-mail.";

    if (ticket.status === "closed") {
        hint = "Responder reabre a conversa.";
    }

    return (
        <div className="grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-8">
            <TicketHeader ticket={ticket} />
            <TicketTimeline messages={ticket.messages} video={ticket.video} />
            <TicketReplyCard
                hint={hint}
                onSend={async (message) => {
                    await replyToMyTicket({ data: { ticketId, message } });
                    await invalidateSupportQueries(queryClient);
                }}
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
            title="Não foi possível carregar a conversa"
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
