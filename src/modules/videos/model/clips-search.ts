import { z } from "zod";
import { CLIP_ORDERS, DEFAULT_CLIP_ORDER } from "#/modules/videos/model/clip-order";
import type { ClipOrder } from "#/modules/videos/model/clip-order";
import { CLIP_VIEW_MODES, DEFAULT_CLIP_VIEW_MODE } from "#/modules/videos/model/clip-view-mode";
import type { ClipViewMode } from "#/modules/videos/model/clip-view-mode";
import { MAX_CLIP_SEARCH_LENGTH } from "#/modules/videos/model/library-clips-page";

/** The Cortes tab's URL state: the search, the order and the view. The defaults stay out of the URL. */
export const clipsSearchSchema = z.object({
    q: z.string().trim().max(MAX_CLIP_SEARCH_LENGTH).optional().catch(undefined),
    order: z.enum(CLIP_ORDERS).optional().catch(undefined),
    view: z.enum(CLIP_VIEW_MODES).optional().catch(undefined),
});

export type ClipsSearch = z.infer<typeof clipsSearchSchema>;

export interface ClipsState {
    query: string;
    order: ClipOrder;
    view: ClipViewMode;
}

export function toClipsSearch(state: ClipsState): ClipsSearch {
    const search: ClipsSearch = {};
    const trimmedQuery = state.query.trim();

    if (trimmedQuery.length > 0) {
        search.q = trimmedQuery;
    }

    if (state.order !== DEFAULT_CLIP_ORDER) {
        search.order = state.order;
    }

    if (state.view !== DEFAULT_CLIP_VIEW_MODE) {
        search.view = state.view;
    }

    return search;
}
