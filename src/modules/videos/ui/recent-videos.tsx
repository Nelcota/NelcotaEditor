import HistoryIcon from "~icons/solar/history-linear";
import AltArrowDownIcon from "~icons/solar/alt-arrow-down-linear";
import { useQuery } from "@tanstack/react-query";
import { useId } from "react";
import type { ReactNode } from "react";
import { Link, useMatch } from "@tanstack/react-router";
import { toCrewLine } from "#/modules/videos/crew-lines";
import { isVideoWorking } from "#/modules/videos/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import { MarkedVideoMascot } from "#/modules/videos/ui/marked-video-mascot";
import { videosQueryOptions } from "#/modules/videos/ui/video-queries";
import { cn } from "#/shared/ui/cn";
import { CollapsibleTooltip } from "#/shared/ui/collapsible-tooltip";
import { Progress } from "#/shared/ui/progress";
import { Skeleton } from "#/shared/ui/skeleton";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";
import { useStoredFlag } from "#/shared/ui/use-stored-flag";

const RECENT_VIDEO_LIMIT = 8;
const SKELETON_COUNT = 3;
const HIDDEN_STORAGE_KEY = "nelcota:recent-videos-hidden";

function lineToneClass(video: VideoSummary): string {
    if (isVideoWorking(video.status) === true || video.status === "queued") {
        return "text-primary";
    }

    if (video.status === "failed") {
        return "text-destructive";
    }

    return "text-muted-foreground";
}

interface RecentVideoProps {
    video: VideoSummary;
    isCurrent: boolean;
    isCollapsed: boolean;
}

function RecentVideo({ video, isCurrent, isCollapsed }: RecentVideoProps) {
    const crewLine = toCrewLine(video);

    return (
        <CollapsibleTooltip
            isEnabled={isCollapsed}
            label={
                <>
                    {video.title}
                    <span className="block font-medium opacity-70">{crewLine}</span>
                </>
            }
        >
            <Link
                to="/videos/$videoId"
                params={{ videoId: video.id }}
                aria-current={toAriaCurrent(isCurrent)}
                className={cn(
                    "flex min-w-0 items-center gap-3 rounded-xl px-2.5 py-2 outline-none transition-colors hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]",
                    isCurrent === true && "bg-accent",
                    isCollapsed === true && "justify-center px-0",
                )}
            >
                <MarkedVideoMascot video={video} className="size-8" />
                {isCollapsed === false && (
                    <span className="grid min-w-0 flex-1 gap-0.5">
                        <span className="truncate text-sm font-semibold" title={video.title}>
                            {video.title}
                        </span>
                        <span className={cn("truncate text-[13px]", lineToneClass(video))}>
                            {crewLine}
                        </span>
                        {isVideoWorking(video.status) === true && (
                            <Progress
                                value={video.progressPercent}
                                aria-label="Progresso do processamento"
                                className="mt-0.5 h-1"
                            />
                        )}
                    </span>
                )}
                {isCollapsed === true && <span className="sr-only">{video.title}</span>}
            </Link>
        </CollapsibleTooltip>
    );
}

function RecentVideosLoading() {
    return (
        <div
            className="grid gap-2 px-2.5 pt-2"
            aria-busy="true"
            aria-label="Carregando vídeos recentes"
        >
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <Skeleton key={index} className="h-10 rounded-xl" />
            ))}
        </div>
    );
}

interface RecentVideosHeadingProps {
    isCollapsed: boolean;
    isHidden: boolean;
    listId: string;
    onToggle: () => void;
}

/** A heading that hides or shows the list when there is room for it; a thin divider otherwise. */
function RecentVideosHeading({
    isCollapsed,
    isHidden,
    listId,
    onToggle,
}: RecentVideosHeadingProps) {
    if (isCollapsed === true) {
        return <span className="mx-auto my-3 h-px w-8 bg-border" aria-hidden="true" />;
    }

    return (
        <h2 className="pt-4">
            <button
                type="button"
                aria-expanded={isHidden === false}
                aria-controls={listId}
                onClick={onToggle}
                className="flex h-8 w-full items-center justify-between rounded-lg px-3 text-xs font-bold tracking-wider text-muted-foreground uppercase transition-colors outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]"
            >
                <span className="flex items-center gap-2">
                    <HistoryIcon aria-hidden="true" className="size-4" />
                    Recentes
                </span>
                <AltArrowDownIcon
                    aria-hidden="true"
                    className={cn("size-4 transition-transform", isHidden === true && "-rotate-90")}
                />
            </button>
        </h2>
    );
}

/** Videos being processed come first, so they can be followed without opening their page. */
function pinWorkingVideos(videos: Array<VideoSummary>): Array<VideoSummary> {
    const working = videos.filter((video) => isVideoWorking(video.status) === true);
    const others = videos.filter((video) => isVideoWorking(video.status) === false);

    return [...working, ...others];
}

function SeeAllLink(): ReactNode {
    return (
        <Link
            to="/"
            className="flex h-9 items-center justify-center rounded-lg text-sm font-semibold text-muted-foreground transition-colors outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]"
        >
            Ver todos
        </Link>
    );
}

/** The latest videos, each saying where it is in the voice of its crew member. */
export function RecentVideos({ isCollapsed }: { isCollapsed: boolean }) {
    const videosQuery = useQuery(videosQueryOptions());
    const videos = videosQuery.data;
    const videoMatch = useMatch({ from: "/_app/videos/$videoId", shouldThrow: false });
    const currentVideoId = videoMatch?.params.videoId;
    const hiddenFlag = useStoredFlag(HIDDEN_STORAGE_KEY);
    const listId = useId();

    if (videos === undefined) {
        return <RecentVideosLoading />;
    }

    if (videos.length === 0) {
        return null;
    }

    return (
        <section aria-label="Vídeos recentes" className="grid gap-0.5">
            <RecentVideosHeading
                isCollapsed={isCollapsed}
                isHidden={hiddenFlag.isOn}
                listId={listId}
                onToggle={hiddenFlag.toggle}
            />
            <div
                id={listId}
                hidden={hiddenFlag.isOn === true && isCollapsed === false}
                className="grid gap-0.5"
            >
                {pinWorkingVideos(videos)
                    .slice(0, RECENT_VIDEO_LIMIT)
                    .map((video) => (
                        <RecentVideo
                            key={video.id}
                            video={video}
                            isCurrent={video.id === currentVideoId}
                            isCollapsed={isCollapsed}
                        />
                    ))}
                {videos.length > RECENT_VIDEO_LIMIT && isCollapsed === false && <SeeAllLink />}
            </div>
        </section>
    );
}
