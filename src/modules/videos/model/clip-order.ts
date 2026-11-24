import type { LibraryClip } from "#/modules/videos/model/video-views";

export const CLIP_ORDERS = ["newest", "best"] as const;

export type ClipOrder = (typeof CLIP_ORDERS)[number];

export const DEFAULT_CLIP_ORDER: ClipOrder = "newest";

export const CLIP_ORDER_LABELS: Record<ClipOrder, string> = {
    newest: "Recentes",
    best: "Maior nota",
};

const ORDER_COMPARATORS: Record<ClipOrder, (first: LibraryClip, second: LibraryClip) => number> = {
    // The server already sends them newest first.
    newest: () => 0,
    best: (first, second) => second.clip.score - first.clip.score,
};

export function isClipOrder(value: string): value is ClipOrder {
    return CLIP_ORDERS.some((order) => order === value);
}

export function sortLibraryClips(items: Array<LibraryClip>, order: ClipOrder): Array<LibraryClip> {
    return items.toSorted(ORDER_COMPARATORS[order]);
}
