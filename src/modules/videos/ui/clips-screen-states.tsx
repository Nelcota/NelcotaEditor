import type { ReactNode } from "react";
import RestartIcon from "~icons/solar/restart-linear";
import { NewVideoLink } from "#/modules/videos/ui/new-video-link";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { Skeleton } from "#/shared/ui/skeleton";

const SKELETON_ROW_COUNT = 5;

/** The toolbar over the same bordered list as the library, so nothing jumps on arrival. */
export function ClipsLoading(): ReactNode {
    return (
        <div role="status" className="grid gap-4">
            <span className="sr-only">Carregando cortes</span>
            <Skeleton className="h-10 w-full rounded-full sm:w-72" />
            <div className="rounded-2xl border bg-popover px-4 sm:px-5">
                {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-x-4 border-b py-3 last:border-b-0"
                    >
                        <Skeleton className="aspect-[9/16] rounded-xl" />
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

export function ClipsLoadError({ onRetry }: { onRetry: () => void }) {
    return (
        <EmptyState
            art={<StageCrewMascot status="failed" className="size-14" />}
            title="Não foi possível carregar seus cortes"
            description="Eles continuam salvos. Tente de novo; se continuar, recarregue a página."
            action={
                <Button variant="secondary" onClick={onRetry}>
                    <RestartIcon aria-hidden="true" />
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
