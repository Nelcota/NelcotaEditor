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

const SKELETON_CARD_COUNT = 6;

export function VideoListLoading() {
    return (
        <div className="@container" aria-busy="true" aria-label="Carregando vídeos">
            <div className="grid grid-cols-1 gap-x-5 gap-y-7 @xl:grid-cols-2 @4xl:grid-cols-3">
                {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
                    <div key={index} className="grid gap-2.5">
                        <Skeleton className="aspect-video rounded-2xl" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-2/5" />
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
                <Button asChild size="lg" className="rounded-full font-bold">
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

/** Names the search when there is one; otherwise it was the status filter that emptied the list. */
function describeNoMatch(query: string): string {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
        return "Nenhum vídeo neste filtro";
    }

    return `Nenhum vídeo com “${trimmedQuery}”`;
}

export function NoMatchState({ query, onClear }: { query: string; onClear: () => void }) {
    return (
        <EmptyState
            art={<MagnifierCloseIcon className="size-8 text-muted-foreground" aria-hidden="true" />}
            title={describeNoMatch(query)}
            description="A busca olha só o título. Confira a grafia ou limpe a busca e o filtro para ver todos."
            action={
                <Button variant="secondary" className="rounded-full" onClick={onClear}>
                    Limpar busca e filtro
                </Button>
            }
        />
    );
}
