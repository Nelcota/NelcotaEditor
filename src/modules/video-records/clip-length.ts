/**
 * How long each clip of a video should be: "short" (about 30 s), "minute" (about 60 s) or
 * "free" (whatever the moment needs). The seconds behind each one belong to the clips module.
 */
export const CLIP_LENGTHS = ["short", "minute", "free"] as const;

export type ClipLength = (typeof CLIP_LENGTHS)[number];

// Videos from before the choice existed were cut freely, so "free" keeps them unchanged.
export const DEFAULT_CLIP_LENGTH: ClipLength = "free";
