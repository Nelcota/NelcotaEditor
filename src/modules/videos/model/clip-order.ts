export const CLIP_ORDERS = ["newest", "best"] as const;

export type ClipOrder = (typeof CLIP_ORDERS)[number];

export const DEFAULT_CLIP_ORDER: ClipOrder = "newest";

export const CLIP_ORDER_LABELS: Record<ClipOrder, string> = {
    newest: "Recentes",
    best: "Maior nota",
};
