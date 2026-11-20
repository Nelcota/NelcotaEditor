export const CLIP_STATUSES = ["pending", "rendering", "done", "failed"] as const;

export type ClipStatus = (typeof CLIP_STATUSES)[number];
