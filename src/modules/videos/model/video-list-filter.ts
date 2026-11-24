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
