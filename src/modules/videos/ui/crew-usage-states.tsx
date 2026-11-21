import RestartIcon from "~icons/solar/restart-linear";
import { HOST_NAME } from "#/modules/videos/crew-lines";
import { STAT_GRID_CLASS } from "#/modules/videos/ui/crew-stat-tile";
import { NewVideoLink } from "#/modules/videos/ui/new-video-link";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { BRAND_MASCOT_INDEX, Mascot } from "#/shared/ui/mascot";
import { Skeleton } from "#/shared/ui/skeleton";

const STAT_COUNT = 4;

export function UsageError({ onRetry }: { onRetry: () => void }) {
    return (
        <EmptyState
            art={<StageCrewMascot status="failed" className="size-14" />}
            title="Não foi possível carregar o uso"
            description="Guarda não conseguiu buscar os números. Tente de novo; se continuar, recarregue a página."
            action={
                <Button variant="secondary" onClick={onRetry}>
                    <RestartIcon aria-hidden="true" />
                    Tentar de novo
                </Button>
            }
        />
    );
}

export function UsageLoading() {
    return (
        <div className="grid gap-3" aria-busy="true" aria-label="Carregando uso">
            <div className={STAT_GRID_CLASS}>
                {Array.from({ length: STAT_COUNT }, (_, index) => (
                    <Skeleton key={index} className="h-36 rounded-2xl" />
                ))}
            </div>
            <Skeleton className="h-24 rounded-2xl" />
        </div>
    );
}

export function NoUsageYet() {
    return (
        <EmptyState
            art={<Mascot index={BRAND_MASCOT_INDEX} className="size-14" />}
            title="A equipe ainda não trabalhou para você"
            description={`Adicione um vídeo e o ${HOST_NAME} chama a turma: aqui aparece tudo o que ela fizer.`}
            action={<NewVideoLink emphasis="secondary" />}
        />
    );
}
