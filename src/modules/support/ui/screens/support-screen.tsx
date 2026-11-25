import RotateCwIcon from "~icons/lucide/rotate-cw";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useId } from "react";
import type { ReactNode } from "react";
import { myTicketsQueryOptions } from "#/modules/support/model/support-queries";
import { TicketTable } from "#/modules/support/ui/components/ticket-table";
import { TopicChoice } from "#/modules/support/ui/components/topic-choice";
import { AsyncButton } from "#/shared/ui/async-button";
import { Skeleton } from "#/shared/ui/skeleton";

const SKELETON_ROW_COUNT = 3;

function ConversationsLoading(): ReactNode {
    return (
        <div role="status" className="grid gap-2">
            <span className="sr-only">Carregando suas conversas</span>
            {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl" />
            ))}
        </div>
    );
}

/** Below the doors: the person's conversations with their states, or one line when none yet. */
function Conversations(): ReactNode {
    const headingId = useId();
    const ticketsQuery = useInfiniteQuery(myTicketsQueryOptions());
    const pages = ticketsQuery.data?.pages ?? [];
    const tickets = pages.flatMap((page) => page.rows);

    return (
        <section aria-labelledby={headingId} className="grid gap-3">
            <h2 id={headingId} className="text-lg font-bold">
                Suas conversas
            </h2>
            {ticketsQuery.isPending === true && <ConversationsLoading />}
            {ticketsQuery.isError === true && pages.length === 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-card-border p-4">
                    <p className="flex-1 text-muted-foreground">
                        Não foi possível carregar suas conversas. Confira sua conexão.
                    </p>
                    <AsyncButton variant="secondary" onAction={() => ticketsQuery.refetch()}>
                        <RotateCwIcon aria-hidden="true" />
                        Tentar de novo
                    </AsyncButton>
                </div>
            )}
            {ticketsQuery.isSuccess === true && tickets.length === 0 && (
                <p className="text-muted-foreground">
                    Nenhuma conversa ainda. Escolha uma área acima para começar.
                </p>
            )}
            {tickets.length > 0 && (
                <TicketTable
                    tickets={tickets}
                    labelledBy={headingId}
                    nextPage={{
                        hasNextPage: ticketsQuery.hasNextPage,
                        isFetching: ticketsQuery.isFetchingNextPage,
                        hasFailed: ticketsQuery.isFetchNextPageError,
                        onLoadMore: async () => {
                            await ticketsQuery.fetchNextPage();
                        },
                    }}
                />
            )}
        </section>
    );
}

/** Suporte as a help desk: the two areas as doors on top, the conversations below. */
export function SupportScreen(): ReactNode {
    return (
        <div className="grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-8">
            <header className="grid max-w-2xl gap-2">
                <p className="text-xs font-bold tracking-eyebrow text-primary-ink uppercase">
                    Geral
                </p>
                <h1 className="text-title font-extrabold tracking-[-0.02em] sm:text-4xl">
                    Como podemos ajudar?
                </h1>
                <p className="text-muted-foreground">
                    Escolha a área. A conversa vai direto para quem cuida dela.
                </p>
            </header>
            <TopicChoice />
            <Conversations />
        </div>
    );
}
