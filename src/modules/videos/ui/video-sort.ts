import { constructSortFn } from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";

export const VIDEO_SORTS = ["newest", "oldest", "title"] as const;

export type VideoSort = (typeof VIDEO_SORTS)[number];

export const DEFAULT_VIDEO_SORT: VideoSort = "newest";

export const VIDEO_SORT_LABELS: Record<VideoSort, string> = {
    newest: "Recentes",
    oldest: "Antigos",
    title: "De A a Z",
};

const titleCollator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

/** "Edição 2" before "edicao 10": ignores case and accents, and reads numbers as numbers. */
export const titleSortFn = constructSortFn({
    sort: (first: unknown, second: unknown) => titleCollator.compare(String(first), String(second)),
});

/** ISO timestamps sort as text in time order. */
export const isoDateSortFn = constructSortFn({
    sort: (first: unknown, second: unknown) => String(first).localeCompare(String(second)),
});

/** Each sort choice as the table's sorting state, by the columns in video-list-filter. */
export const VIDEO_SORTING: Record<VideoSort, SortingState> = {
    newest: [{ id: "createdAt", desc: true }],
    oldest: [{ id: "createdAt", desc: false }],
    title: [{ id: "title", desc: false }],
};

export function toVideoSort(value: string): VideoSort {
    return VIDEO_SORTS.find((sort) => sort === value) ?? DEFAULT_VIDEO_SORT;
}
