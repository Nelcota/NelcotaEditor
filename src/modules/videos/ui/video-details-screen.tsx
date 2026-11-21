import ArrowLeftIcon from "~icons/solar/arrow-left-linear";
import RestartIcon from "~icons/solar/restart-linear";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { VideoHeader } from "#/modules/videos/ui/video-header";
import type { VideoPageSearch } from "#/modules/videos/ui/video-page-search";
import { VideoPageTabs } from "#/modules/videos/ui/video-page-tabs";
import type { StudioTabProps } from "#/modules/videos/ui/video-page-tabs";
import { videoDetailsQueryOptions } from "#/modules/videos/ui/video-queries";
import { Button } from "#/shared/ui/button";
import { EmptyState } from "#/shared/ui/empty-state";
import { Skeleton } from "#/shared/ui/skeleton";

const SKELETON_CLIP_COUNT = 4;

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
                    <Button variant="secondary" onClick={onRetry}>
                        <RestartIcon aria-hidden="true" />
                        Tentar de novo
                    </Button>
                    <Button asChild variant="ghost">
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
    StudioTab: ComponentType<StudioTabProps>;
}

export function VideoDetailsScreen({ videoId, search, StudioTab }: VideoDetailsScreenProps) {
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
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
            <VideoHeader video={video} />
            <VideoPageTabs details={details} search={search} StudioTab={StudioTab} />
        </div>
    );
}
