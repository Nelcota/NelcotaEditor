import { z } from "zod";

export const VIDEO_PAGE_TABS = ["clips", "original", "studio"] as const;

const MAX_CLIP_PARAM_LENGTH = 64;

export type VideoPageTab = (typeof VIDEO_PAGE_TABS)[number];

/** The video page's URL state: which tab is open and, in the Studio, which clip. */
export const videoPageSearchSchema = z.object({
    tab: z.enum(VIDEO_PAGE_TABS).optional().catch(undefined),
    // Any text, not only a UUID: a mistyped clip must reach the Studio as "not found" instead of
    // turning into no clip, which opens the best one as if nothing was asked.
    clip: z.string().trim().min(1).max(MAX_CLIP_PARAM_LENGTH).optional().catch(undefined),
});

export type VideoPageSearch = z.infer<typeof videoPageSearchSchema>;
