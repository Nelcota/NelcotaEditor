import {
    columnFilteringFeature,
    constructFilterFn,
    createColumnHelper,
    createFilteredRowModel,
    createPaginatedRowModel,
    filterFn_includesString,
    rowPaginationFeature,
    tableFeatures,
} from "@tanstack/react-table";
import { isVideoFinished } from "#/modules/videos/video-status";
import type { VideoStatus } from "#/modules/videos/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import { normalizeForSearch } from "#/shared/ui/normalize-for-search";

export const VIDEO_FILTERS = ["all", "processing", "done", "failed", "cancelled"] as const;

export type VideoFilter = (typeof VIDEO_FILTERS)[number];

export const ALL_FILTER: VideoFilter = "all";

export const VIDEO_FILTER_LABELS: Record<VideoFilter, string> = {
    all: "Todos",
    processing: "Processando",
    done: "Prontos",
    failed: "Com erro",
    cancelled: "Cancelados",
};

const STATUS_PREDICATES: Record<VideoFilter, (status: VideoStatus) => boolean> = {
    all: () => true,
    processing: (status) => isVideoFinished(status) === false,
    done: (status) => status === "done",
    failed: (status) => status === "failed",
    cancelled: (status) => status === "cancelled",
};

export const VIDEOS_PER_PAGE = 20;

function isVideoFilter(value: unknown): value is VideoFilter {
    return VIDEO_FILTERS.some((filter) => filter === value);
}

/** Table cells and filter values arrive untyped; only text (or a number) can be searched. */
function normalizeCellForSearch(value: unknown): string {
    if (typeof value === "string") {
        return normalizeForSearch(value);
    }

    if (typeof value === "number") {
        return normalizeForSearch(String(value));
    }

    return "";
}

/** The built-in "includes" filter, made to ignore case and accents: "edicao" finds "Edição". */
const titleSearchFilter = constructFilterFn({
    ...filterFn_includesString,
    resolveFilterValue: normalizeCellForSearch,
    resolveDataValue: normalizeCellForSearch,
});

const statusGroupFilter = constructFilterFn({
    filter: (status: VideoStatus, filter: unknown) =>
        isVideoFilter(filter) === false || STATUS_PREDICATES[filter](status) === true,
    autoRemove: (filter: unknown) => filter === ALL_FILTER,
});

export const videoTableFeatures = tableFeatures({
    columnFilteringFeature,
    rowPaginationFeature,
    filteredRowModel: createFilteredRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
});

const columnHelper = createColumnHelper<typeof videoTableFeatures, VideoSummary>();

/** Only the columns the table filters on; the row layout itself stays in VideoRow. */
export const videoTableColumns = columnHelper.columns([
    columnHelper.accessor("title", { filterFn: titleSearchFilter }),
    columnHelper.accessor("status", { filterFn: statusGroupFilter }),
]);

export function countVideosByFilter(videos: Array<VideoSummary>): Record<VideoFilter, number> {
    const countMatching = (filter: VideoFilter): number =>
        videos.filter((video) => STATUS_PREDICATES[filter](video.status)).length;

    return {
        all: videos.length,
        processing: countMatching("processing"),
        done: countMatching("done"),
        failed: countMatching("failed"),
        cancelled: countMatching("cancelled"),
    };
}
