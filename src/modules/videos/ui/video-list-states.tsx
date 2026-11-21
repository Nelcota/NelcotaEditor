import type { ReactNode } from "react";
import AddIcon from "~icons/solar/add-linear";
import RestartIcon from "~icons/solar/restart-linear";
import MagnifierCloseIcon from "~icons/solar/magnifier-close-linear";
import { Link } from "@tanstack/react-router";
import { HOST_NAME } from "#/modules/videos/crew-lines";
import { WORKING_CREW } from "#/modules/videos/stage-crew";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { Button } from "#/shared/ui/button";
import { BrandMark } from "#/shared/ui/brand-logo";
import { EmptyState } from "#/shared/ui/empty-state";
import { Mascot } from "#/shared/ui/mascot";
import { Skeleton } from "#/shared/ui/skeleton";

const SKELETON_ROW_COUNT = 5;

/** The toolbar's two rows over the same bordered list as `VideoGallery`, so nothing jumps. */
export function VideoListLoading(): ReactNode {
    return (
        <div role="status" className="grid gap-6">
            <span className="sr-only">Carregando vídeos</span>
            <div className="grid gap-3">
                <Skeleton className="h-10 w-full rounded-full sm:w-72" />
                <Skeleton className="h-10 w-48 rounded-full" />
            </div>
            <div className="rounded-2xl border bg-popover px-4 sm:px-5">
                {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-x-4 border-b py-3 last:border-b-0 sm:grid-cols-[128px_minmax(0,1fr)]"
                    >
                        <Skeleton className="aspect-video rounded-lg" />
                        <div className="grid gap-2">
                            <Skeleton className="h-5 w-3/5" />
                            <Skeleton className="h-4 w-2/5" />
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
                <Button asChild size="lg" className="rounded-full font-semibold">
                    <Link to="/" search={{ newVideo: true }}>
                        <AddIcon aria-hidden="true" />
                        Enviar o primeiro vídeo
                    </Link>
                </Button>
            }
        />
    );
}

export function VideoListLoadError({ onRetry }: { onRetry: () => void }) {
    return (
        <EmptyState
            art={<StageCrewMascot status="failed" className="size-14" />}
            title="Não foi possível carregar seus vídeos"
            description="Seus vídeos e cortes continuam salvos. Tente de novo; se continuar, recarregue a página."
            action={
                <Button variant="secondary" className="rounded-full" onClick={onRetry}>
                    <RestartIcon aria-hidden="true" />
                    Tentar de novo
                </Button>
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
            art={<MagnifierCloseIcon className="size-8 text-muted-foreground" aria-hidden="true" />}
            title={copy.title}
            description={copy.description}
            action={
                <Button variant="secondary" className="rounded-full" onClick={onClear}>
                    {copy.actionLabel}
                </Button>
            }
        />
    );
}
