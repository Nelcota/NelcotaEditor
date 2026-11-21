import type { VideoSummary } from "#/modules/videos/video-views";

export const VIDEO_SORTS = ["newest", "oldest", "title"] as const;

export type VideoSort = (typeof VIDEO_SORTS)[number];

export const DEFAULT_VIDEO_SORT: VideoSort = "newest";

export const VIDEO_SORT_LABELS: Record<VideoSort, string> = {
    newest: "Mais recentes",
    oldest: "Mais antigos",
    title: "De A a Z",
};

const titleCollator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

const COMPARATORS: Record<VideoSort, (first: VideoSummary, second: VideoSummary) => number> = {
    newest: (first, second) => second.createdAt.localeCompare(first.createdAt),
    oldest: (first, second) => first.createdAt.localeCompare(second.createdAt),
    title: (first, second) => titleCollator.compare(first.title, second.title),
};

export function sortVideos(videos: Array<VideoSummary>, sort: VideoSort): Array<VideoSummary> {
    return videos.toSorted(COMPARATORS[sort]);
}

export function toVideoSort(value: string): VideoSort {
    return VIDEO_SORTS.find((sort) => sort === value) ?? DEFAULT_VIDEO_SORT;
}
