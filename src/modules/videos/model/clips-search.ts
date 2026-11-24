import { z } from "zod";
import { CLIP_ORDERS, DEFAULT_CLIP_ORDER } from "#/modules/videos/model/clip-order";
import type { ClipOrder } from "#/modules/videos/model/clip-order";
import { MAX_CLIP_SEARCH_LENGTH } from "#/modules/videos/model/library-clips-page";

/** The Cortes tab's URL state: the search and the order. The defaults stay out of the URL. */
export const clipsSearchSchema = z.object({
    q: z.string().trim().max(MAX_CLIP_SEARCH_LENGTH).optional().catch(undefined),
    order: z.enum(CLIP_ORDERS).optional().catch(undefined),
});

export type ClipsSearch = z.infer<typeof clipsSearchSchema>;

export function toClipsSearch(query: string, order: ClipOrder): ClipsSearch {
    const search: ClipsSearch = {};
    const trimmedQuery = query.trim();

    if (trimmedQuery.length > 0) {
        search.q = trimmedQuery;
    }

    if (order !== DEFAULT_CLIP_ORDER) {
        search.order = order;
    }

    return search;
}
