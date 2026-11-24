import { z } from "zod";

export const VIDEO_PAGE_TABS = ["clips", "original", "studio"] as const;

export type VideoPageTab = (typeof VIDEO_PAGE_TABS)[number];

/** The video page's URL state: which tab is open and, in the Studio, which clip. */
export const videoPageSearchSchema = z.object({
    tab: z.enum(VIDEO_PAGE_TABS).optional().catch(undefined),
    clip: z.uuid().optional().catch(undefined),
});

export type VideoPageSearch = z.infer<typeof videoPageSearchSchema>;
