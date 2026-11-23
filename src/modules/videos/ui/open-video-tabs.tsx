import PlusIcon from "~icons/lucide/plus";
import XIcon from "~icons/lucide/x";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import type { VideoSummary } from "#/modules/videos/video-views";
import { MoreVideoTabs } from "#/modules/videos/ui/more-video-tabs";
import { countVisibleTabs, splitOpenTabs } from "#/modules/videos/ui/open-video-tabs-layout";
import { useElementWidth } from "#/shared/ui/use-element-width";
import { useOpenVideoTabs } from "#/modules/videos/ui/use-open-video-tabs";
import { useVideosQuery } from "#/modules/videos/ui/use-videos-query";
import { VideoMascot } from "#/modules/videos/ui/video-mascot";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import { Skeleton } from "#/shared/ui/skeleton";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";

const TAB_CLASS =
    "group relative flex h-9 w-56 min-w-36 shrink items-center gap-2 rounded-xl border border-transparent ps-2.5 pe-1 text-sm font-medium text-muted-foreground transition-[color,background-color,box-shadow] hover:bg-foreground/5 hover:text-foreground has-[a[aria-current=page]]:bg-background has-[a[aria-current=page]]:text-foreground has-[a[aria-current=page]]:shadow-[0_1px_2px_rgb(0_0_0/0.06),0_0_0_1px_var(--border)]";

/** Only the videos that still exist, in the order they were opened. */
function toOpenVideos(videoIds: Array<string>, videos: Array<VideoSummary>): Array<VideoSummary> {
    return videoIds.flatMap((videoId) => videos.filter((video) => video.id === videoId));
}

/** Closing the tab in view moves to its neighbour, or back to the list when it was the last one. */
function findNextVideoId(openVideos: Array<VideoSummary>, closedId: string): string | undefined {
    const closedIndex = openVideos.findIndex((video) => video.id === closedId);
    const remaining = openVideos.filter((video) => video.id !== closedId);

    if (remaining.length === 0) {
        return undefined;
    }

    const nextIndex = Math.min(Math.max(closedIndex, 0), remaining.length - 1);

    return remaining[nextIndex]?.id;
}

/** Before the measure, every tab shows, as they did before the "+N" existed. */
function toVisibleCount(navWidth: number | null, tabCount: number): number {
    if (navWidth === null) {
        return tabCount;
    }

    return countVisibleTabs(navWidth, tabCount);
}

interface VideoTabProps {
    video: VideoSummary;
    isCurrent: boolean;
    onClose: () => void;
}

function VideoTab({ video, isCurrent, onClose }: VideoTabProps): ReactNode {
    return (
        <li className={TAB_CLASS}>
            <Link
                to="/videos/$videoId"
                params={{ videoId: video.id }}
                aria-current={toAriaCurrent(isCurrent)}
                title={video.title}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg outline-none motion-safe:active:scale-[0.99] after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-4 focus-visible:after:ring-ring"
            >
                <VideoMascot videoId={video.id} className="size-5 shrink-0" />
                <span className="truncate">{video.title}</span>
            </Link>
            <button
                type="button"
                onClick={onClose}
                aria-label={`Fechar a aba de ${video.title}`}
                className={cn(
                    "relative z-10 grid size-7 shrink-0 place-items-center rounded-sm text-muted-foreground opacity-0 outline-none transition-[opacity,background-color,color] group-hover:opacity-100 pointer-coarse:opacity-100 hover:bg-foreground/8 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]",
                    isCurrent === true && "opacity-100",
                )}
            >
                <XIcon aria-hidden="true" className="size-4" />
            </button>
        </li>
    );
}

/** Holds the tabs' place while the videos load, so the plus does not jump when they arrive. */
function TabPlaceholders({ count }: { count: number }): ReactNode {
    return Array.from({ length: count }, (_, index) => (
        <li key={index} aria-hidden="true" className="flex h-9 w-56 min-w-36 shrink items-center">
            <Skeleton className="h-9 w-full rounded-xl" />
        </li>
    ));
}

/**
 * The top bar's tabs: every video opened stays one click away, like documents in a window. Tabs
 * never shrink past a readable width; the ones that do not fit wait in "+N". The plus after them
 * starts a new video.
 */
export function OpenVideoTabs(): ReactNode {
    const navigate = useNavigate();
    const tabs = useOpenVideoTabs();
    const videosQuery = useVideosQuery();
    const currentVideoId = useParams({ strict: false, select: (params) => params.videoId });
    const [navElement, setNavElement] = useState<HTMLElement | null>(null);
    const navWidth = useElementWidth(navElement);
    const openVideos = toOpenVideos(tabs.videoIds, videosQuery.data ?? []);
    const visibleCount = toVisibleCount(navWidth, openVideos.length);
    const split = splitOpenTabs(openVideos, visibleCount, currentVideoId);
    const isLoadingVideos = videosQuery.isPending;
    const placeholderCount = toVisibleCount(navWidth, tabs.videoIds.length);
    // The closed tab's button leaves with it; focus waits on the plus instead of falling to the page.
    const newVideoRef = useRef<HTMLAnchorElement>(null);

    const closeTab = async (videoId: string): Promise<void> => {
        const nextVideoId = findNextVideoId(openVideos, videoId);
        tabs.close(videoId);

        const newVideoLink = newVideoRef.current;

        if (videoId !== currentVideoId && newVideoLink !== null) {
            newVideoLink.focus();
            return;
        }

        if (videoId !== currentVideoId) {
            return;
        }

        if (nextVideoId === undefined) {
            await navigate({ to: "/" });
            return;
        }

        await navigate({ to: "/videos/$videoId", params: { videoId: nextVideoId } });
    };

    return (
        <nav
            ref={setNavElement}
            aria-label="Vídeos abertos"
            className="flex w-full min-w-0 items-center gap-1"
        >
            <ul className="flex min-w-0 items-center gap-1">
                {isLoadingVideos === true && <TabPlaceholders count={placeholderCount} />}
                {split.visible.map((video) => (
                    <VideoTab
                        key={video.id}
                        video={video}
                        isCurrent={video.id === currentVideoId}
                        onClose={async () => {
                            await closeTab(video.id);
                        }}
                    />
                ))}
            </ul>
            <MoreVideoTabs videos={split.hidden} />
            <HintTooltip label="Novo vídeo">
                <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                >
                    <Link
                        ref={newVideoRef}
                        to="/"
                        search={{ newVideo: true }}
                        preload="intent"
                        aria-label="Novo vídeo"
                    >
                        <PlusIcon aria-hidden="true" />
                    </Link>
                </Button>
            </HintTooltip>
        </nav>
    );
}
