import ArrowRightIcon from "~icons/lucide/arrow-right";
import LayersIcon from "~icons/lucide/layers";
import RotateCwIcon from "~icons/lucide/rotate-cw";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { myEditsQueryOptions } from "#/modules/viral-formats/model/edit-queries";
import type { EditSessionSummary } from "#/modules/viral-formats/model/edit-session";
import { myEditSessionsQueryOptions } from "#/modules/viral-formats/model/edit-session-queries";
import type { EditView } from "#/modules/viral-formats/model/edit-view";
import { EditList } from "#/modules/viral-formats/ui/components/edit-list";
import { EditSessionList } from "#/modules/viral-formats/ui/components/edit-session-list";
import { useFinishedEditsAnnouncement } from "#/modules/viral-formats/ui/hooks/use-finished-edits-announcement";
import { AsyncButton } from "#/shared/ui/async-button";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { Skeleton } from "#/shared/ui/skeleton";

const SKELETON_ROW_COUNT = 3;

function EditsLoading(): ReactNode {
    return (
        <div role="status" className="grid gap-3">
            <span className="sr-only">Carregando suas edições</span>
            {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-2xl" />
            ))}
        </div>
    );
}

function NoEditsYet(): ReactNode {
    return (
        <EmptyState
            art={<LayersIcon aria-hidden="true" className="size-10 text-primary-ink" />}
            title="Você ainda não editou nenhum vídeo"
            description="Escolha um formato e suba seus vídeos brutos."
            action={
                <Button asChild className="font-bold">
                    <Link to="/formats">
                        Ver os formatos
                        <ArrowRightIcon aria-hidden="true" className="size-4" />
                    </Link>
                </Button>
            }
        />
    );
}

interface EditsListsProps {
    sessions: ReadonlyArray<EditSessionSummary>;
    edits: ReadonlyArray<EditView>;
}

function EditsLists({ sessions, edits }: EditsListsProps): ReactNode {
    if (sessions.length === 0 && edits.length === 0) {
        return <NoEditsYet />;
    }

    return (
        <div className="grid gap-8">
            {sessions.length > 0 && (
                <section aria-labelledby="edit-sessions" className="grid gap-3">
                    <h2 id="edit-sessions" className="text-lg font-bold">
                        Lotes
                    </h2>
                    <EditSessionList sessions={sessions} />
                </section>
            )}
            {edits.length > 0 && (
                <section aria-labelledby="edited-videos" className="grid gap-3">
                    <h2 id="edited-videos" className="text-lg font-bold">
                        Vídeos editados
                    </h2>
                    <EditList edits={edits} />
                </section>
            )}
        </div>
    );
}

function EditsContent(): ReactNode {
    const editsQuery = useQuery(myEditsQueryOptions());
    const sessionsQuery = useQuery(myEditSessionsQueryOptions());
    const editList = editsQuery.data;
    const sessions = sessionsQuery.data;

    if (
        (editsQuery.isError === true && editList === undefined) ||
        (sessionsQuery.isError === true && sessions === undefined)
    ) {
        return (
            <div className="grid justify-items-start gap-3">
                <p className="text-muted-foreground">
                    Não foi possível carregar suas edições. Confira sua conexão.
                </p>
                <AsyncButton
                    variant="secondary"
                    onAction={async () => {
                        await Promise.all([editsQuery.refetch(), sessionsQuery.refetch()]);
                    }}
                >
                    <RotateCwIcon aria-hidden="true" />
                    Tentar de novo
                </AsyncButton>
            </div>
        );
    }

    if (editList === undefined || sessions === undefined) {
        return <EditsLoading />;
    }

    return <EditsLists sessions={sessions} edits={editList} />;
}

/** Minhas edições: what the person's Claude edited in the formats, while and after it renders. */
export function EditsScreen(): ReactNode {
    const editsQuery = useQuery(myEditsQueryOptions());
    const announcement = useFinishedEditsAnnouncement(editsQuery.data);

    return (
        <div className="grid max-w-4xl grid-cols-[minmax(0,1fr)] gap-8">
            <p role="status" className="sr-only">
                {announcement}
            </p>
            <header className="grid max-w-2xl gap-2">
                <p className="text-xs font-bold tracking-eyebrow text-primary-ink uppercase">
                    Histórico
                </p>
                <h1 className="text-title font-extrabold tracking-[-0.02em] sm:text-4xl">
                    Minhas edições
                </h1>
                <p className="max-w-xl text-pretty text-muted-foreground">
                    Seus lotes de vídeos brutos e o que o seu Claude já editou ficam aqui.
                </p>
            </header>
            <EditsContent />
        </div>
    );
}
