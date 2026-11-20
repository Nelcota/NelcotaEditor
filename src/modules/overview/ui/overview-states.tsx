import RestartIcon from "~icons/solar/restart-linear";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { Skeleton } from "#/shared/ui/skeleton";

const METRIC_CARD_COUNT = 6;

export function OverviewLoading() {
    return (
        <div className="grid gap-4" aria-busy="true" aria-label="Carregando o painel">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <div className="grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: METRIC_CARD_COUNT }, (_, index) => (
                        <Skeleton key={index} className="h-[132px] rounded-2xl" />
                    ))}
                </div>
                <Skeleton className="h-[436px] rounded-2xl" />
            </div>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <Skeleton className="h-[380px] rounded-2xl" />
                <Skeleton className="h-[380px] rounded-2xl" />
            </div>
        </div>
    );
}

export function OverviewLoadError({ onRetry }: { onRetry: () => void }) {
    return (
        <EmptyState
            art={<StageCrewMascot status="failed" className="size-14" />}
            title="Não foi possível carregar o painel"
            description="Seus vídeos e cortes continuam salvos; só os números não vieram. Tente de novo."
            action={
                <Button variant="secondary" className="rounded-full" onClick={onRetry}>
                    <RestartIcon aria-hidden="true" />
                    Tentar de novo
                </Button>
            }
        />
    );
}
