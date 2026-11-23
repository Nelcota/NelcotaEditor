import type { ReactNode } from "react";
import RotateCwIcon from "~icons/lucide/rotate-cw";
import { NewVideoLink } from "#/modules/videos/ui/new-video-link";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { Skeleton } from "#/shared/ui/skeleton";

/** Two rows of the widest grid, so the first screen is full on any width. */
const SKELETON_CARD_COUNT = 8;

function ClipCardSkeleton(): ReactNode {
    return (
        <li className="grid min-w-0 content-start gap-3">
            <Skeleton className="aspect-[9/16] w-full" />
            <div className="grid gap-1.5">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-4 w-3/5" />
            </div>
            <div className="grid gap-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
            </div>
        </li>
    );
}

/** The library's own toolbar and grid, drawn empty, so nothing jumps when the clips arrive. */
export function ClipsLoading(): ReactNode {
    return (
        <div role="status" className="grid grid-cols-[minmax(0,1fr)] gap-6">
            <span className="sr-only">Carregando cortes</span>
            <div aria-hidden="true" className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-10 w-full rounded-xl sm:w-72" />
                <Skeleton className="h-10 w-full rounded-xl sm:ms-auto sm:w-64" />
                <div className="w-full">
                    <Skeleton className="h-5 w-20" />
                </div>
            </div>
            {/* Same columns as the grid in clip-library.tsx. */}
            <div aria-hidden="true" className="@container/clips">
                <ul className="grid grid-cols-2 gap-x-4 gap-y-8 @2xl/clips:grid-cols-3 @2xl/clips:gap-x-6 @4xl/clips:grid-cols-4 @6xl/clips:grid-cols-5">
                    {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
                        <ClipCardSkeleton key={index} />
                    ))}
                </ul>
            </div>
        </div>
    );
}

export function ClipsLoadError({ onRetry }: { onRetry: () => void }) {
    return (
        <EmptyState
            art={<StageCrewMascot status="failed" className="size-14" />}
            title="Não foi possível carregar seus cortes"
            description="Eles continuam salvos. Tente de novo; se continuar, recarregue a página."
            action={
                <Button variant="secondary" onClick={onRetry}>
                    <RotateCwIcon aria-hidden="true" />
                    Tentar de novo
                </Button>
            }
        />
    );
}

export function NoClipsYet() {
    return (
        <EmptyState
            art={<StageCrewMascot status="rendering" className="size-14" />}
            title="Nenhum corte pronto ainda"
            description="Os cortes de todos os seus vídeos aparecem aqui assim que ficam prontos."
            action={
                <div className="w-48">
                    <NewVideoLink emphasis="primary" />
                </div>
            }
        />
    );
}
