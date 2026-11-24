import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";
import type { VideoSummary } from "#/modules/videos/video-views";
import { LibraryToolbar } from "#/modules/videos/ui/library-toolbar";
import { useLibraryFilter } from "#/modules/videos/ui/use-library-filter";
import { useStageAnnouncement } from "#/modules/videos/ui/use-stage-announcement";
import { useVideoListControls } from "#/modules/videos/ui/use-video-list-controls";
import { useVideoPage } from "#/modules/videos/ui/use-video-page";
import { useVideosQuery } from "#/modules/videos/ui/use-videos-query";
import { ALL_FILTER, countVideosByFilter } from "#/modules/videos/ui/video-list-filter";
import { VIDEO_TABLE_COLUMNS, VideoListRow } from "#/modules/videos/ui/video-list-row";
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

const TABLE_HEADINGS = ["Vídeo", "Status", "Origem", "Cortes", "Progresso", "Enviado", ""];

/** The column names over the rows; the rows say the same to screen readers, so it is hidden. */
function TableHead(): ReactNode {
    return (
        <div
            aria-hidden="true"
            className={cn(
                "hidden h-11 items-center gap-x-4 bg-card px-4 text-xs font-semibold text-muted-foreground @4xl:grid",
                VIDEO_TABLE_COLUMNS,
            )}
        >
            {TABLE_HEADINGS.map((heading, index) => (
                <span key={`${heading}-${index}`}>{heading}</span>
            ))}
        </div>
    );
}

interface FilterableVideoListProps {
    videos: Array<VideoSummary>;
    action?: ReactNode;
}

/** Search, status and order over one table of rows. */
function FilterableVideoList({ videos, action }: FilterableVideoListProps): ReactNode {
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
                action={action}
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
                <div className="@container overflow-hidden rounded-2xl border">
                    <TableHead />
                    <ul aria-label="Seus vídeos" className="divide-y @4xl:border-t">
                        {page.videos.map((video) => (
                            <VideoListRow key={video.id} video={video} />
                        ))}
                    </ul>
                </div>
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

/** The Vídeos page body: loading, the first-video welcome, the load error or the table itself. */
export function VideoList({ action }: { action?: ReactNode }): ReactNode {
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

    return <FilterableVideoList videos={videos} action={action} />;
}
