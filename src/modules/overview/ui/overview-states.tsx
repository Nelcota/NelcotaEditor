import RestartIcon from "~icons/solar/restart-linear";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { Skeleton } from "#/shared/ui/skeleton";

const CREW_CARD_COUNT = 4;

/** The board's own shape (crew cards, time and failures, best clips, chart), so nothing jumps. */
export function OverviewLoading() {
    return (
        <div role="status" className="@container">
            <span className="sr-only">Carregando o painel</span>
            <div className="grid gap-8">
                <div className="grid gap-3">
                    <Skeleton className="h-6 w-64 max-w-full" />
                    <div className="grid gap-3 @lg:grid-cols-2 @4xl:grid-cols-4">
                        {Array.from({ length: CREW_CARD_COUNT }, (_, index) => (
                            <Skeleton key={index} className="h-[248px] rounded-2xl" />
                        ))}
                    </div>
                </div>
                <Skeleton className="h-[118px] rounded-2xl" />
                <Skeleton className="h-[480px] rounded-2xl @2xl:h-[600px]" />
                <Skeleton className="h-[410px] rounded-2xl" />
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
