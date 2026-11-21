import type { ReactNode } from "react";
import type { VideoSummary } from "#/modules/videos/video-views";
import { LibraryToolbar } from "#/modules/videos/ui/library-toolbar";
import { useLibraryFilter } from "#/modules/videos/ui/use-library-filter";
import { useStageAnnouncement } from "#/modules/videos/ui/use-stage-announcement";
import { useVideoListControls } from "#/modules/videos/ui/use-video-list-controls";
import { useVideoPage } from "#/modules/videos/ui/use-video-page";
import { useVideosQuery } from "#/modules/videos/ui/use-videos-query";
import { ALL_FILTER, countVideosByFilter } from "#/modules/videos/ui/video-list-filter";
import { VideoListRow } from "#/modules/videos/ui/video-list-row";
import {
    FirstVideoEmptyState,
    NoMatchState,
    VideoListLoadError,
    VideoListLoading,
} from "#/modules/videos/ui/video-list-states";
import { VideoPager } from "#/modules/videos/ui/video-pager";
import { pluralize } from "#/shared/ui/pluralize";

function describeTotal(shownCount: number, totalCount: number): string {
    if (shownCount === totalCount) {
        return `${totalCount} ${pluralize(totalCount, "vídeo", "vídeos")}`;
    }

    return `${shownCount} de ${totalCount} vídeos`;
}

/** Search, status and order over one card of rows. */
function FilterableVideoList({ videos }: { videos: Array<VideoSummary> }): ReactNode {
    const libraryFilter = useLibraryFilter();
    const filter = libraryFilter.filter;
    const controls = useVideoListControls(filter);
    const page = useVideoPage({ videos, filter, controls });
    const announcement = useStageAnnouncement(page.videos);
    const pagination = controls.pagination;
    const matchingCount = page.matchingCount;

    return (
        <div className="grid gap-4">
            <LibraryToolbar
                query={controls.query}
                onQueryChange={controls.changeQuery}
                filter={filter}
                onFilterChange={libraryFilter.changeFilter}
                counts={countVideosByFilter(videos)}
                sort={controls.sort}
                onSortChange={controls.changeSort}
            />
            <p role="status" className="sr-only">
                {describeTotal(matchingCount, videos.length)}. {announcement}
            </p>
            {matchingCount === 0 && (
                <div>
                    <NoMatchState
                        query={controls.query}
                        onClear={() => {
                            controls.changeQuery("");
                            libraryFilter.changeFilter(ALL_FILTER);
                        }}
                    />
                </div>
            )}
            {matchingCount > 0 && (
                <ul
                    aria-label="Seus vídeos"
                    className="divide-y overflow-hidden rounded-2xl border bg-background"
                >
                    {page.videos.map((video) => (
                        <VideoListRow key={video.id} video={video} />
                    ))}
                </ul>
            )}
            <div>
                <VideoPager
                    pageIndex={page.pageIndex}
                    pageCount={page.pageCount}
                    itemCount={matchingCount}
                    onPageChange={(pageIndex) =>
                        controls.changePagination({ ...pagination, pageIndex })
                    }
                />
            </div>
        </div>
    );
}

/** The home page's body: loading, the first-video welcome, the load error or the list itself. */
export function VideoList(): ReactNode {
    const videosQuery = useVideosQuery();
    const videos = videosQuery.data;

    if (videosQuery.isError === true && videos === undefined) {
        return (
            <div>
                <VideoListLoadError
                    onRetry={async () => {
                        await videosQuery.refetch();
                    }}
                />
            </div>
        );
    }

    if (videos === undefined) {
        return <VideoListLoading />;
    }

    if (videos.length === 0) {
        return (
            <div>
                <FirstVideoEmptyState />
            </div>
        );
    }

    return <FilterableVideoList videos={videos} />;
}
