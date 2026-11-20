import type { OnChangeFn, PaginationState } from "@tanstack/react-table";
import { useState } from "react";
import { VIDEOS_PER_PAGE } from "#/modules/videos/ui/video-list-filter";
import type { VideoFilter } from "#/modules/videos/ui/video-list-filter";
import { DEFAULT_VIDEO_SORT } from "#/modules/videos/ui/video-sort";
import type { VideoSort } from "#/modules/videos/ui/video-sort";

const FIRST_PAGE: PaginationState = { pageIndex: 0, pageSize: VIDEOS_PER_PAGE };

export interface VideoListControls {
    query: string;
    sort: VideoSort;
    pagination: PaginationState;
    changeQuery: (query: string) => void;
    changeSort: (sort: VideoSort) => void;
    changePagination: OnChangeFn<PaginationState>;
}

/** Search, sort and page of the list; any change to what is listed starts again on page one. */
export function useVideoListControls(filter: VideoFilter): VideoListControls {
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<VideoSort>(DEFAULT_VIDEO_SORT);
    const [pagination, setPagination] = useState<PaginationState>(FIRST_PAGE);
    const [paginatedFilter, setPaginatedFilter] = useState(filter);

    // Adjusting state while rendering, not in an effect, so the old page never flashes.
    if (paginatedFilter !== filter) {
        setPaginatedFilter(filter);
        setPagination(FIRST_PAGE);
    }

    return {
        query,
        sort,
        pagination,
        changeQuery: (nextQuery) => {
            setQuery(nextQuery);
            setPagination(FIRST_PAGE);
        },
        changeSort: (nextSort) => {
            setSort(nextSort);
            setPagination(FIRST_PAGE);
        },
        changePagination: setPagination,
    };
}
