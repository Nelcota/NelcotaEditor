import { useQuery } from "@tanstack/react-query";
import { FilterableVideoList } from "#/modules/videos/ui/filterable-video-list";
import type { VideoFilter } from "#/modules/videos/ui/video-list-filter";
import {
    FirstVideoEmptyState,
    VideoListLoadError,
    VideoListLoading,
} from "#/modules/videos/ui/video-list-states";
import { videosQueryOptions } from "#/modules/videos/ui/video-queries";

export function VideoList({ filter }: { filter: VideoFilter }) {
    const videosQuery = useQuery(videosQueryOptions());
    const videos = videosQuery.data;

    if (videosQuery.isError === true && videos === undefined) {
        return (
            <VideoListLoadError
                onRetry={async () => {
                    await videosQuery.refetch();
                }}
            />
        );
    }

    if (videos === undefined) {
        return <VideoListLoading />;
    }

    if (videos.length === 0) {
        return <FirstVideoEmptyState />;
    }

    return <FilterableVideoList videos={videos} filter={filter} />;
}
