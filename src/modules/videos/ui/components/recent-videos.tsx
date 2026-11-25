import ArrowRightIcon from "~icons/lucide/arrow-right";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { toCrewLine } from "#/modules/videos/model/crew-lines";
import { ALL_FILTER } from "#/modules/videos/model/video-list-filter";
import { videoListQueryOptions } from "#/modules/videos/model/video-queries";
import { DEFAULT_VIDEO_SORT } from "#/modules/videos/model/video-sort";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { VideoThumbnail } from "#/modules/videos/ui/components/video-thumbnail";

const RECENT_VIDEO_COUNT = 3;

// The Vídeos page's own default list, so both share one cache entry and the progress poll.
const RECENT_LIST_REQUEST = { query: "", filter: ALL_FILTER, sort: DEFAULT_VIDEO_SORT };

function RecentVideoLink({ video }: { video: VideoSummary }): ReactNode {
    return (
        <li>
            <Link
                to="/videos/$videoId"
                params={{ videoId: video.id }}
                className="flex min-w-0 items-center gap-3 rounded-xl p-2 outline-none transition-[background-color,scale] hover:bg-accent focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-99"
            >
                <VideoThumbnail video={video} />
                <span className="grid min-w-0 text-start">
                    <span className="truncate text-sm font-medium">{video.title}</span>
                    <span className="truncate text-xs text-muted-foreground">
                        {toCrewLine(video)}
                    </span>
                </span>
            </Link>
        </li>
    );
}

/** The last videos under the Início box, so a returning person picks up where they left off. */
export function RecentVideos(): ReactNode {
    const listQuery = useInfiniteQuery(videoListQueryOptions(RECENT_LIST_REQUEST));
    const firstPage = listQuery.data?.pages[0];

    if (listQuery.isError === true) {
        return (
            <p role="status" className="text-sm text-muted-foreground">
                Não foi possível carregar seus vídeos recentes.
            </p>
        );
    }

    // Loading or no videos yet: the box above is the whole page.
    if (firstPage === undefined || firstPage.items.length === 0) {
        return null;
    }

    const recentVideos = firstPage.items.slice(0, RECENT_VIDEO_COUNT);

    return (
        <section aria-labelledby="recent-videos-title" className="grid w-full max-w-3xl gap-2">
            <div className="flex items-center justify-between gap-3 px-2">
                <h2 id="recent-videos-title" className="text-sm font-semibold">
                    Recentes
                </h2>
                <Link
                    to="/videos"
                    className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring"
                >
                    Ver todos
                    <ArrowRightIcon aria-hidden="true" className="size-3.5" />
                </Link>
            </div>
            <ul className="grid gap-1 sm:grid-cols-3">
                {recentVideos.map((video) => (
                    <RecentVideoLink key={video.id} video={video} />
                ))}
            </ul>
        </section>
    );
}
