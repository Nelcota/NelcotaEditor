import ArrowLeftIcon from "~icons/solar/arrow-left-linear";
import RestartIcon from "~icons/solar/restart-linear";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import type { ComponentType, ReactNode } from "react";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { VideoHeader } from "#/modules/videos/ui/video-header";
import type { VideoPageSearch } from "#/modules/videos/ui/video-page-search";
import { VideoPageTabs } from "#/modules/videos/ui/video-page-tabs";
import type { StudioTabProps } from "#/modules/videos/ui/video-page-tabs";
import { videoDetailsQueryOptions } from "#/modules/videos/ui/video-queries";
import { useIsInspectorHidden } from "#/modules/videos/ui/inspector-toggle";
import { useOpenVideoTabs } from "#/modules/videos/ui/use-open-video-tabs";
import { VideoInspector } from "#/modules/videos/ui/video-inspector";
import type { VideoDetails } from "#/modules/videos/video-views";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { EmptyState } from "#/shared/ui/empty-state";
import { Skeleton } from "#/shared/ui/skeleton";

const SKELETON_CLIP_COUNT = 4;

// One shrinkable track: without it the grid sizes to its widest child (the tab list) and pushes
// the menu and the last tab past a 320px screen.
const PAGE_COLUMN_CLASS =
    "grid min-w-0 content-start grid-cols-[minmax(0,1fr)] gap-6 px-4 pt-4 pb-12 md:px-8 md:pt-6";

function LoadingState() {
    return (
        <div
            className={cn(PAGE_COLUMN_CLASS, "gap-8")}
            aria-busy="true"
            aria-label="Carregando vídeo"
        >
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
        <div className={PAGE_COLUMN_CLASS}>
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
        </div>
    );
}

interface VideoWorkspaceProps {
    details: VideoDetails;
    search: VideoPageSearch;
    StudioTab: ComponentType<StudioTabProps>;
}

/**
 * The page column and, from lg, the inspector beside it, each scrolling on its own. The Studio
 * needs the width, so the inspector steps aside there; the top bar's toggle hides it anywhere.
 * Opening a video also opens its tab in the top bar.
 */
function VideoWorkspace({ details, search, StudioTab }: VideoWorkspaceProps): ReactNode {
    const video = details.video;
    const videoId = video.id;
    const tabs = useOpenVideoTabs();
    const openTab = tabs.open;
    const isInspectorHidden = useIsInspectorHidden();
    const isInspectorShown = isInspectorHidden === false && search.tab !== "studio";

    useEffect(() => {
        openTab(videoId);
    }, [openTab, videoId]);

    return (
        <div
            className={cn(
                "grid min-h-0 grid-cols-[minmax(0,1fr)] md:h-full md:overflow-y-auto lg:overflow-hidden",
                isInspectorShown === true && "lg:grid-cols-[minmax(0,1fr)_400px]",
            )}
        >
            <div className={cn(PAGE_COLUMN_CLASS, "lg:overflow-y-auto")}>
                <VideoHeader video={video} isInspectorShown={isInspectorShown} />
                <VideoPageTabs details={details} search={search} StudioTab={StudioTab} />
            </div>
            {isInspectorShown === true && (
                <aside
                    aria-label="Detalhes do vídeo"
                    className="border-t bg-inspector px-4 py-8 md:px-6 lg:overflow-y-auto lg:border-t-0 lg:border-s"
                >
                    <VideoInspector details={details} />
                </aside>
            )}
        </div>
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

    return <VideoWorkspace details={details} search={search} StudioTab={StudioTab} />;
}
