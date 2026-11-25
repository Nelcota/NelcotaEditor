export const CLIP_VIEW_MODES = ["grid", "table"] as const;

export type ClipViewMode = (typeof CLIP_VIEW_MODES)[number];

export const DEFAULT_CLIP_VIEW_MODE: ClipViewMode = "grid";

export const CLIP_VIEW_MODE_LABELS: Record<ClipViewMode, string> = {
    grid: "Grade",
    table: "Tabela",
};
