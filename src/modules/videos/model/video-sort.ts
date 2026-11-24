export const VIDEO_SORTS = ["newest", "oldest", "title"] as const;

export type VideoSort = (typeof VIDEO_SORTS)[number];

export const DEFAULT_VIDEO_SORT: VideoSort = "newest";

export const VIDEO_SORT_LABELS: Record<VideoSort, string> = {
    newest: "Recentes",
    oldest: "Antigos",
    title: "De A a Z",
};

export function toVideoSort(value: string): VideoSort {
    return VIDEO_SORTS.find((sort) => sort === value) ?? DEFAULT_VIDEO_SORT;
}
