import type { ReactNode } from "react";
import PlusIcon from "~icons/lucide/plus";
import RotateCwIcon from "~icons/lucide/rotate-cw";
import SearchXIcon from "~icons/lucide/search-x";
import { Link } from "@tanstack/react-router";
import { HOST_NAME } from "#/modules/videos/model/crew-lines";
import { WORKING_CREW } from "#/modules/videos/model/stage-crew";
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

function CrewWelcomeArt() {
    return (
        <div className="grid justify-items-center gap-3">
            <BrandMark className="size-16" />
            <div className="flex gap-1.5" aria-hidden="true">
                {WORKING_CREW.map((index) => (
                    <Mascot key={index} index={index} className="size-9" />
                ))}
            </div>
        </div>
    );
}

export function FirstVideoEmptyState() {
    return (
        <EmptyState
            art={<CrewWelcomeArt />}
            title={`Oi! Eu sou o ${HOST_NAME}.`}
            description="Cole um link do YouTube ou envie um arquivo e a equipe começa: Faísca baixa, Tinta transcreve, Brilho escolhe os melhores momentos e Brasa faz os cortes."
            action={
                <Button asChild size="lg" className="font-semibold">
                    <Link to="/videos" search={{ newVideo: true }}>
                        <PlusIcon aria-hidden="true" />
                        Enviar o primeiro vídeo
                    </Link>
                </Button>
            }
        />
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
