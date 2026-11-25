import PlusIcon from "~icons/lucide/plus";
import RotateCwIcon from "~icons/lucide/rotate-cw";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { myTicketsQueryOptions } from "#/modules/support/model/support-queries";
import { TicketList } from "#/modules/support/ui/components/ticket-list";
import { AsyncButton } from "#/shared/ui/async-button";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { BRAND_MASCOT_INDEX, Mascot } from "#/shared/ui/mascot";
import { PageHeader } from "#/shared/ui/page-header";
import { Skeleton } from "#/shared/ui/skeleton";

const SKELETON_ROW_COUNT = 3;

function NewTicketLink(): ReactNode {
    return (
        <Button asChild>
            <Link to="/support/new">
                <PlusIcon aria-hidden="true" />
                Abrir ticket
            </Link>
        </Button>
    );
}

function SupportLoading(): ReactNode {
    return (
        <div role="status" className="grid max-w-3xl gap-3">
            <span className="sr-only">Carregando seus tickets</span>
            {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
        </div>
    );
}

/** The Suporte page: the person's tickets, newest activity first. */
export function SupportScreen(): ReactNode {
    const ticketsQuery = useInfiniteQuery(myTicketsQueryOptions());
    const pages = ticketsQuery.data?.pages ?? [];
    const tickets = pages.flatMap((page) => page.rows);

    return (
        <div className="grid gap-6">
            <PageHeader
                title="Suporte"
                description="Seus tickets com o suporte do Editor Oculto."
                action={<NewTicketLink />}
            />
            {ticketsQuery.isPending === true && <SupportLoading />}
            {ticketsQuery.isError === true && pages.length === 0 && (
                <EmptyState
                    art={<Mascot index={BRAND_MASCOT_INDEX} className="size-14" />}
                    title="Não foi possível carregar seus tickets"
                    description="Confira sua conexão e tente de novo."
                    action={
                        <AsyncButton variant="outline" onAction={() => ticketsQuery.refetch()}>
                            <RotateCwIcon aria-hidden="true" />
                            Tentar de novo
                        </AsyncButton>
                    }
                />
            )}
            {ticketsQuery.isSuccess === true && tickets.length === 0 && (
                <EmptyState
                    art={<Mascot index={BRAND_MASCOT_INDEX} className="size-14" />}
                    title="Nenhum ticket ainda"
                    description="Abra um ticket quando precisar de ajuda com um vídeo ou com a conta."
                    action={<NewTicketLink />}
                />
            )}
            {tickets.length > 0 && (
                <TicketList
                    tickets={tickets}
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
        </div>
    );
}
