import { useNavigate } from "@tanstack/react-router";
import type { VideoSummary } from "#/modules/videos/video-views";
import { pluralize } from "#/shared/ui/pluralize";
import { useVideoListControls } from "#/modules/videos/ui/use-video-list-controls";
import { useVideoPage } from "#/modules/videos/ui/use-video-page";
import { VideoGallery } from "#/modules/videos/ui/video-gallery";
import { countVideosByFilter } from "#/modules/videos/ui/video-list-filter";
import type { VideoFilter } from "#/modules/videos/ui/video-list-filter";
import { NoMatchState } from "#/modules/videos/ui/video-list-states";
import { VideoListToolbar } from "#/modules/videos/ui/video-list-toolbar";

function describeTotal(shownCount: number, totalCount: number): string {
    if (shownCount === totalCount) {
        return `${totalCount} ${pluralize(totalCount, "vídeo", "vídeos")}`;
    }

    return `${shownCount} de ${totalCount}`;
}

interface FilterableVideoListProps {
    videos: Array<VideoSummary>;
    filter: VideoFilter;
}

/** The toolbar over the gallery; the status filter comes from the URL, the rest is local. */
export function FilterableVideoList({ videos, filter }: FilterableVideoListProps) {
    const navigate = useNavigate();
    const controls = useVideoListControls(filter);
    const page = useVideoPage({ videos, filter, controls });
    const pagination = controls.pagination;
    const matchingCount = page.matchingCount;

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
            <VideoListToolbar
                sort={controls.sort}
                onSortChange={controls.changeSort}
                query={controls.query}
                onQueryChange={controls.changeQuery}
                filter={filter}
                counts={countVideosByFilter(videos)}
                totalLabel={describeTotal(matchingCount, videos.length)}
            />
            {matchingCount === 0 && (
                <NoMatchState
                    query={controls.query}
                    onClear={async () => {
                        controls.changeQuery("");
                        await navigate({ to: "/", search: {} });
                    }}
                />
            )}
            {matchingCount > 0 && (
                <VideoGallery
                    videos={page.videos}
                    pageIndex={page.pageIndex}
                    pageCount={page.pageCount}
                    itemCount={matchingCount}
                    onPageChange={(pageIndex) =>
                        controls.changePagination({ ...pagination, pageIndex })
                    }
                />
            )}
        </div>
    );
}
