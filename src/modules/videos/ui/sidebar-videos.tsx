import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { isVideoFinished } from "#/modules/video-records/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import { useVideosQuery } from "#/modules/videos/ui/use-videos-query";
import { VideoMascot } from "#/modules/videos/ui/video-mascot";
import { sortVideos } from "#/modules/videos/ui/video-sort";
import { normalizeForSearch } from "#/shared/ui/normalize-for-search";

/**
 * Shared by every sidebar row: 12px inner padding puts the 20px icon slot on 24..44 (icon column
 * centre 34) and the label on 56. The current row gets a bar on the window's edge.
 */
export const SIDEBAR_ITEM_CLASS =
    "relative flex h-10 items-center gap-3 rounded-xl px-3 text-base text-foreground/80 outline-none transition-[color,background-color,scale] hover:bg-foreground/5 hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99] aria-[current=page]:bg-foreground/[0.07] aria-[current=page]:font-medium aria-[current=page]:text-foreground aria-[current=page]:before:absolute aria-[current=page]:before:-start-2.5 aria-[current=page]:before:h-5 aria-[current=page]:before:w-1 aria-[current=page]:before:rounded-full aria-[current=page]:before:bg-foreground [&>svg]:size-5 [&>svg]:shrink-0";

/** Section headers start on the icon column's leading edge (24px), left of the labels. */
export function SidebarSectionTitle({ children }: { children: ReactNode }): ReactNode {
    return <h2 className="px-3 pt-5 pb-1.5 text-sm text-muted-foreground">{children}</h2>;
}

function matchesQuery(video: VideoSummary, query: string): boolean {
    const normalizedQuery = normalizeForSearch(query.trim());

    if (normalizedQuery.length === 0) {
        return true;
    }

    return normalizeForSearch(video.title).includes(normalizedQuery);
}

function SidebarVideoLink({ video }: { video: VideoSummary }): ReactNode {
    return (
        <li>
            <Link
                to="/videos/$videoId"
                params={{ videoId: video.id }}
                title={video.title}
                className={SIDEBAR_ITEM_CLASS}
            >
                <VideoMascot videoId={video.id} className="size-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{video.title}</span>
                {isVideoFinished(video.status) === false && (
                    <span className="font-mono text-xs text-primary-ink tabular-nums">
                        {video.progressPercent}%
                    </span>
                )}
            </Link>
        </li>
    );
}

interface VideoSectionProps {
    title: string;
    videos: Array<VideoSummary>;
}

function VideoSection({ title, videos }: VideoSectionProps): ReactNode {
    if (videos.length === 0) {
        return null;
    }

    return (
        <section aria-label={title}>
            <SidebarSectionTitle>{title}</SidebarSectionTitle>
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-0.5">
                {videos.map((video) => (
                    <SidebarVideoLink key={video.id} video={video} />
                ))}
            </ul>
        </section>
    );
}

/** The videos in the sidebar: the ones at work first, then every other, newest first. */
export function SidebarVideos({ query }: { query: string }): ReactNode {
    const videosQuery = useVideosQuery();
    const videos = sortVideos(videosQuery.data ?? [], "newest").filter((video) =>
        matchesQuery(video, query),
    );
    const workingVideos = videos.filter((video) => isVideoFinished(video.status) === false);
    const finishedVideos = videos.filter((video) => isVideoFinished(video.status) === true);

    if (videos.length === 0 && query.trim().length > 0) {
        return (
            <p className="px-3 pt-5 text-sm text-muted-foreground">Nenhum vídeo com esse nome.</p>
        );
    }

    return (
        <>
            <VideoSection title="Processando" videos={workingVideos} />
            <VideoSection title="Prontos" videos={finishedVideos} />
        </>
    );
}
