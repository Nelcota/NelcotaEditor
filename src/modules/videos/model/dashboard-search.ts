import { z } from "zod";
import { ALL_FILTER, VIDEO_FILTERS } from "#/modules/videos/model/video-list-filter";
import type { VideoFilter } from "#/modules/videos/model/video-list-filter";

/** The list's URL state: which status filter is on and whether "Novo vídeo" is open. */
export const dashboardSearchSchema = z.object({
    status: z.enum(VIDEO_FILTERS).optional().catch(undefined),
    newVideo: z.boolean().optional().catch(undefined),
});

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>;

/** "Todos" is the default, so it stays out of the URL. */
export function toStatusSearch(filter: VideoFilter): VideoFilter | undefined {
    if (filter === ALL_FILTER) {
        return undefined;
    }

    return filter;
}
