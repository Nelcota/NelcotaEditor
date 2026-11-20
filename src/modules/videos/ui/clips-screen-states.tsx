import RestartIcon from "~icons/solar/restart-linear";
import { NewVideoLink } from "#/modules/videos/ui/new-video-link";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { Skeleton } from "#/shared/ui/skeleton";

const SKELETON_ROW_COUNT = 4;

export function ClipsLoading() {
    return (
        <div className="grid gap-3" aria-busy="true" aria-label="Carregando cortes">
            {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
                <Skeleton key={index} className="h-56 rounded-2xl" />
            ))}
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
                <Button variant="secondary" className="rounded-full" onClick={onRetry}>
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
