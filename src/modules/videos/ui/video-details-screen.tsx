import ArrowLeftIcon from "~icons/solar/arrow-left-linear";
import RestartIcon from "~icons/solar/restart-linear";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { VideoHeader } from "#/modules/videos/ui/video-header";
import type { VideoPageSearch } from "#/modules/videos/ui/video-page-search";
import { VideoPageTabs } from "#/modules/videos/ui/video-page-tabs";
import { videoDetailsQueryOptions } from "#/modules/videos/ui/video-queries";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { Skeleton } from "#/shared/ui/skeleton";

const SKELETON_CLIP_COUNT = 4;

/** Phones have no sidebar, so they get the way back here. */
function BackLink() {
    return (
        <Link
            to="/"
            className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99] md:hidden"
        >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Seus vídeos
        </Link>
    );
}

function LoadingState() {
    return (
        <div className="grid gap-8" aria-busy="true" aria-label="Carregando vídeo">
            <div className="flex items-center gap-4">
                <Skeleton className="size-14 rounded-full" />
                <div className="grid flex-1 gap-2.5">
                    <Skeleton className="h-7 w-3/5" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {Array.from({ length: SKELETON_CLIP_COUNT }, (_, index) => (
                    <Skeleton key={index} className="aspect-[9/16] rounded-2xl" />
                ))}
            </div>
        </div>
    );
}

function LoadErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <EmptyState
            art={<StageCrewMascot status="failed" className="size-14" />}
            title="Não foi possível abrir este vídeo"
            description={`${message} Ele pode ter sido excluído em outra aba ou o link está incompleto.`}
            action={
                <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="secondary" className="rounded-full" onClick={onRetry}>
                        <RestartIcon aria-hidden="true" />
                        Tentar de novo
                    </Button>
                    <Button asChild variant="ghost" className="rounded-full">
                        <Link to="/">
                            <ArrowLeftIcon aria-hidden="true" />
                            Voltar para seus vídeos
                        </Link>
                    </Button>
                </div>
            }
        />
    );
}

interface VideoDetailsScreenProps {
    videoId: string;
    search: VideoPageSearch;
}

export function VideoDetailsScreen({ videoId, search }: VideoDetailsScreenProps) {
    const detailsQuery = useQuery(videoDetailsQueryOptions(videoId));
    const details = detailsQuery.data;

    if (detailsQuery.isError === true && details === undefined) {
        return (
            <LoadErrorState
                message={detailsQuery.error.message}
                onRetry={async () => {
                    await detailsQuery.refetch();
                }}
            />
        );
    }

    if (details === undefined) {
        return <LoadingState />;
    }

    const video = details.video;

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <BackLink />
            <VideoHeader video={video} />
            <VideoPageTabs details={details} search={search} />
        </div>
    );
}
