import type { ReactNode } from "react";
import PlusIcon from "~icons/lucide/plus";
import RotateCwIcon from "~icons/lucide/rotate-cw";
import SearchXIcon from "~icons/lucide/search-x";
import { Link } from "@tanstack/react-router";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { CREW_NAMES } from "#/modules/videos/model/crew-lines";
import { STAGE_CREW } from "#/modules/videos/model/stage-crew";
import { StageCrewMascot } from "#/modules/videos/ui/components/stage-crew-mascot";
import { Button } from "#/shared/ui/button";
import { BrandMark } from "#/shared/ui/brand-logo";
import { EmptyState } from "#/shared/ui/empty-state";
import { Mascot } from "#/shared/ui/mascot";
import { Skeleton } from "#/shared/ui/skeleton";
import { AsyncButton } from "#/shared/ui/async-button";

const SKELETON_ROW_COUNT = 5;

/** The toolbar and the list card at their real sizes, so nothing jumps when they load. */
export function VideoListLoading(): ReactNode {
    return (
        <div role="status" className="grid gap-4">
            <span className="sr-only">Carregando vídeos</span>
            <Skeleton className="h-10 w-full rounded-xl sm:w-72" />
            <div className="divide-y rounded-2xl border">
                {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
                    <div key={index} className="flex items-center gap-4 px-4 py-3">
                        <Skeleton className="h-[63px] w-28 rounded-lg" />
                        <div className="grid flex-1 gap-2">
                            <Skeleton className="h-4 w-3/5" />
                            <Skeleton className="h-3.5 w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** What each working crew member does, in pipeline order. */
const CREW_STEPS: ReadonlyArray<{ status: VideoStatus; task: string }> = [
    { status: "downloading", task: "baixa o vídeo" },
    { status: "transcribing", task: "transcreve a fala" },
    { status: "selecting", task: "escolhe os momentos" },
    { status: "rendering", task: "faz os cortes" },
];

function CrewSteps(): ReactNode {
    return (
        <ol
            aria-label="Etapas do processamento"
            className="relative mt-5 mb-3 grid w-full max-w-2xl list-decimal grid-cols-2 gap-x-2 gap-y-5 sm:grid-cols-4 sm:before:absolute sm:before:inset-x-1/8 sm:before:top-5.5 sm:before:border-t sm:before:border-dashed sm:before:border-input"
        >
            {CREW_STEPS.map(({ status, task }) => (
                <li key={status} className="relative min-w-0 marker:text-transparent">
                    <div className="grid justify-items-center">
                        <Mascot index={STAGE_CREW[status]} className="mb-2 size-11 bg-muted" />
                        <span className="font-semibold">{CREW_NAMES[status]}</span>
                        <span className="text-meta text-muted-foreground [overflow-wrap:anywhere]">
                            {task}
                        </span>
                    </div>
                </li>
            ))}
        </ol>
    );
}

export function FirstVideoEmptyState() {
    return (
        <EmptyState
            art={<BrandMark className="mb-1 size-14" />}
            title="Envie seu primeiro vídeo"
            description="Um link do YouTube ou um arquivo. O Nelcota cuida do resto."
            action={
                <Button asChild size="lg" className="font-semibold">
                    <Link to="/videos" search={{ newVideo: true }}>
                        <PlusIcon aria-hidden="true" />
                        Enviar o primeiro vídeo
                    </Link>
                </Button>
            }
        >
            <CrewSteps />
        </EmptyState>
    );
}

export function VideoListLoadError({ onRetry }: { onRetry: () => Promise<unknown> }) {
    return (
        <EmptyState
            art={<StageCrewMascot status="failed" className="size-14" />}
            title="Não foi possível carregar seus vídeos"
            description="Seus vídeos e cortes continuam salvos. Tente de novo; se continuar, recarregue a página."
            action={
                <AsyncButton variant="secondary" onAction={onRetry}>
                    <RotateCwIcon aria-hidden="true" />
                    Tentar de novo
                </AsyncButton>
            }
        />
    );
}

interface NoMatchCopy {
    title: string;
    description: string;
    actionLabel: string;
}

/** Names the search when there is one; otherwise it was the status filter that emptied the list. */
function describeNoMatch(query: string): NoMatchCopy {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
        return {
            title: "Nenhum vídeo neste filtro",
            description: "Nenhum vídeo nesta situação agora.",
            actionLabel: "Ver todos",
        };
    }

    return {
        title: `Nenhum vídeo com “${trimmedQuery}”`,
        description:
            "A busca olha só o título. Confira a grafia ou limpe a busca e o filtro para ver todos.",
        actionLabel: "Limpar busca e filtro",
    };
}

export function NoMatchState({ query, onClear }: { query: string; onClear: () => void }) {
    const copy = describeNoMatch(query);

    return (
        <EmptyState
            art={<SearchXIcon className="size-8 text-muted-foreground" aria-hidden="true" />}
            title={copy.title}
            description={copy.description}
            action={
                <Button variant="secondary" onClick={onClear}>
                    {copy.actionLabel}
                </Button>
            }
        />
    );
}
