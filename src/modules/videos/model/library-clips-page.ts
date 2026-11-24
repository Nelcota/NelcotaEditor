import { z } from "zod";
import { CLIP_ORDERS } from "#/modules/videos/model/clip-order";
import type { LibraryClip } from "#/modules/videos/model/video-views";

/** Two rows of the widest grid and then some; "Carregar mais" brings the next ones. */
export const LIBRARY_CLIPS_PAGE_SIZE = 30;
const MAX_LIBRARY_CLIPS_PAGE_SIZE = 60;
export const MAX_CLIP_SEARCH_LENGTH = 120;

/**
 * Where the previous page stopped: the last clip's sort values, so the next page starts right
 * after it (keyset) even when clips are added or deleted between the two requests.
 */
export const libraryClipCursorSchema = z.object({
    id: z.uuid(),
    createdAt: z.iso.datetime(),
    score: z.number().int(),
    position: z.number().int(),
});

export type LibraryClipCursor = z.infer<typeof libraryClipCursorSchema>;

export const libraryClipsInputSchema = z.object({
    query: z.string().trim().max(MAX_CLIP_SEARCH_LENGTH),
    order: z.enum(CLIP_ORDERS),
    cursor: libraryClipCursorSchema.nullable(),
    limit: z.number().int().min(1).max(MAX_LIBRARY_CLIPS_PAGE_SIZE),
});

export type LibraryClipsInput = z.infer<typeof libraryClipsInputSchema>;

export interface LibraryClipsPage {
    items: Array<LibraryClip>;
    /** Null on the last page. */
    nextCursor: LibraryClipCursor | null;
    /** Every ready clip that matches the search, across all pages. */
    totalCount: number;
}

export function toLibraryClipCursor(item: LibraryClip): LibraryClipCursor {
    const clip = item.clip;

    return { id: clip.id, createdAt: item.createdAt, score: clip.score, position: clip.position };
}
