import { useTable } from "@tanstack/react-table";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useMemo } from "react";
import type { VideoSummary } from "#/modules/videos/video-views";
import { clampPageIndex } from "#/modules/videos/ui/clamp-page-index";
import type { VideoListControls } from "#/modules/videos/ui/use-video-list-controls";
import { videoTableColumns, videoTableFeatures } from "#/modules/videos/ui/video-list-filter";
import type { VideoFilter } from "#/modules/videos/ui/video-list-filter";
import { VIDEO_SORTING } from "#/modules/videos/ui/video-sort";

interface VideoPageInput {
    videos: Array<VideoSummary>;
    filter: VideoFilter;
    controls: VideoListControls;
}

export interface VideoPage {
    videos: Array<VideoSummary>;
    matchingCount: number;
    pageIndex: number;
    pageCount: number;
}

/**
 * Filtering, sorting and pagination run in TanStack Table. The status filter comes from the URL; the title
 * search and the sort are local to the page.
 */
export function useVideoPage({ videos, filter, controls }: VideoPageInput): VideoPage {
    const { query, sort, pagination, changePagination } = controls;
    const columnFilters = useMemo<ColumnFiltersState>(
        () => [
            { id: "title", value: query },
            { id: "status", value: filter },
        ],
        [query, filter],
    );
    const table = useTable({
        features: videoTableFeatures,
        columns: videoTableColumns,
        data: videos,
        getRowId: (video) => video.id,
        state: { columnFilters, sorting: VIDEO_SORTING[sort], pagination },
        onPaginationChange: changePagination,
    });
    const pageCount = table.getPageCount();
    const pageIndex = clampPageIndex(pagination.pageIndex, pageCount);

    // Deleting the last videos of the last page would leave an empty page; step back to a real one.
    if (pageIndex !== pagination.pageIndex) {
        changePagination({ ...pagination, pageIndex });
    }

    return {
        videos: table.getRowModel().rows.map((row) => row.original),
        matchingCount: table.getFilteredRowModel().rows.length,
        pageIndex,
        pageCount,
    };
}
