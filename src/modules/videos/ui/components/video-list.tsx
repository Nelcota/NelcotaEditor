import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { LibraryToolbar } from "#/modules/videos/ui/components/library-toolbar";
import { useLibraryFilter } from "#/modules/videos/ui/hooks/use-library-filter";
import { useStageAnnouncement } from "#/modules/videos/ui/hooks/use-stage-announcement";
import { useVideoListControls } from "#/modules/videos/ui/hooks/use-video-list-controls";
import { useVideoProgressWatch } from "#/modules/videos/ui/hooks/use-video-progress-watch";
import { ALL_FILTER } from "#/modules/videos/model/video-list-filter";
import type { VideoCounts, VideoListPage } from "#/modules/videos/model/video-list-page";
import {
    videoCountsQueryOptions,
    videoListQueryOptions,
} from "#/modules/videos/model/video-queries";
import { VideoListResults } from "#/modules/videos/ui/components/video-list-results";
import {
    FirstVideoEmptyState,
    NoMatchState,
    VideoListLoadError,
    VideoListLoading,
} from "#/modules/videos/ui/components/video-list-states";
import { pluralize } from "#/shared/ui/pluralize";

function describeTotal(loadedCount: number, totalCount: number): string {
    if (loadedCount >= totalCount) {
        return `${totalCount} ${pluralize(totalCount, "vídeo", "vídeos")}`;
    }

    return `${loadedCount} de ${totalCount} vídeos`;
}

/** Nothing until the first page arrives, so the status never reads a count of zero meanwhile. */
function describeLoaded(loadedCount: number, firstPage: VideoListPage | undefined): string {
    if (firstPage === undefined) {
        return "";
    }

    return `${describeTotal(loadedCount, firstPage.totalCount)}.`;
}

interface FilterableVideoListProps {
    counts: VideoCounts;
    action?: ReactNode;
}

/** Search, status and order, all answered by the server, over one table of rows. */
function FilterableVideoList({ counts, action }: FilterableVideoListProps): ReactNode {
    const libraryFilter = useLibraryFilter();
    const filter = libraryFilter.filter;
    const controls = useVideoListControls();
    const listQuery = useInfiniteQuery(
        videoListQueryOptions({ query: controls.query, filter, sort: controls.sort }),
    );
    // The poll sees every video at work, so one that finishes outside this filter is still heard.
    const announcement = useStageAnnouncement(useVideoProgressWatch());
    const pages = listQuery.data?.pages ?? [];
    const firstPage = pages[0];
    const videos = pages.flatMap((page) => page.items);

    return (
        <div className="grid gap-4">
            <LibraryToolbar
                query={controls.draft}
                onQueryChange={controls.changeDraft}
                filter={filter}
                onFilterChange={libraryFilter.changeFilter}
                counts={counts}
                sort={controls.sort}
                onSortChange={controls.changeSort}
                action={action}
            />
            <p role="status" className="sr-only">
                {describeLoaded(videos.length, firstPage)} {announcement}
            </p>
            {listQuery.isError === true && firstPage === undefined && (
                <VideoListLoadError
                    onRetry={async () => {
                        await listQuery.refetch();
                    }}
                />
            )}
            {listQuery.isPending === true && <VideoListLoading />}
            {firstPage !== undefined && firstPage.totalCount === 0 && (
                <NoMatchState
                    query={controls.query}
                    onClear={() => {
                        controls.clearQuery();
                        libraryFilter.changeFilter(ALL_FILTER);
                    }}
                />
            )}
            {videos.length > 0 && (
                <VideoListResults
                    videos={videos}
                    nextPage={{
                        hasNextPage: listQuery.hasNextPage,
                        isFetching: listQuery.isFetchingNextPage,
                        hasFailed: listQuery.isFetchNextPageError,
                        onLoadMore: async () => {
                            await listQuery.fetchNextPage();
                        },
                    }}
                />
            )}
        </div>
    );
}

/** The Vídeos page body: loading, the first-video welcome, the load error or the table itself. */
export function VideoList({ action }: { action?: ReactNode }): ReactNode {
    const countsQuery = useQuery(videoCountsQueryOptions());
    const counts = countsQuery.data;

    if (countsQuery.isError === true && counts === undefined) {
        return (
            <div>
                <VideoListLoadError
                    onRetry={async () => {
                        await countsQuery.refetch();
                    }}
                />
            </div>
        );
    }

    if (counts === undefined) {
        return <VideoListLoading />;
    }

    if (counts.all === 0) {
        return (
            <div>
                <FirstVideoEmptyState />
            </div>
        );
    }

    return <FilterableVideoList counts={counts} action={action} />;
}
