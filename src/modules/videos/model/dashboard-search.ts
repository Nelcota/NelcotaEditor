import { z } from "zod";
import { VIDEO_FILTERS } from "#/modules/videos/model/video-list-filter";

/** The list's URL state: which status filter is on and whether "Novo vídeo" is open. */
export const dashboardSearchSchema = z.object({
    status: z.enum(VIDEO_FILTERS).optional().catch(undefined),
    newVideo: z.boolean().optional().catch(undefined),
});

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>;
