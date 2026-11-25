import { z } from "zod";

export const ADMIN_PAGE_SIZE = 25;
const MAX_SEARCH_LENGTH = 120;
export const MAX_ADMIN_PAGE = 10_000;

export const ADMIN_VIDEO_FILTERS = [
    "all",
    "working",
    "queued",
    "failed",
    "cancelled",
    "done",
] as const;

export type AdminVideoFilter = (typeof ADMIN_VIDEO_FILTERS)[number];

export const DEFAULT_ADMIN_VIDEO_FILTER: AdminVideoFilter = "all";

/** A page number from the URL counts from one; anything odd falls back to the first page. */
const pageSchema = z.coerce.number().int().min(1).max(MAX_ADMIN_PAGE).optional().catch(undefined);
const querySchema = z.string().trim().max(MAX_SEARCH_LENGTH).optional().catch(undefined);

export const adminUsersSearchSchema = z.object({
    q: querySchema,
    page: pageSchema,
});

export type AdminUsersSearch = z.infer<typeof adminUsersSearchSchema>;

export const adminVideosSearchSchema = z.object({
    q: querySchema,
    page: pageSchema,
    // Not "status": the dashboard's search has a "status" with other values, and links that keep
    // the previous search would mix the two.
    filter: z.enum(ADMIN_VIDEO_FILTERS).optional().catch(undefined),
});

export type AdminVideosSearch = z.infer<typeof adminVideosSearchSchema>;

/** What the server functions accept: the same fields, strict, since the client may send anything. */
export const adminUserListInputSchema = z.object({
    query: z.string().trim().max(MAX_SEARCH_LENGTH),
    page: z.number().int().min(1).max(MAX_ADMIN_PAGE),
});

export type AdminUserListInput = z.infer<typeof adminUserListInputSchema>;

export const adminVideoListInputSchema = z.object({
    query: z.string().trim().max(MAX_SEARCH_LENGTH),
    page: z.number().int().min(1).max(MAX_ADMIN_PAGE),
    filter: z.enum(ADMIN_VIDEO_FILTERS),
    /** Narrows the list to one account (the user page); null for every account. */
    ownerId: z.string().min(1).max(MAX_SEARCH_LENGTH).nullable(),
});

export type AdminVideoListInput = z.infer<typeof adminVideoListInputSchema>;

export const adminUserIdInputSchema = z.object({
    userId: z.string().trim().min(1).max(MAX_SEARCH_LENGTH),
});

export const adminVideoIdInputSchema = z.object({ videoId: z.uuid() });

const MAX_BAN_REASON_LENGTH = 300;

export const adminBanInputSchema = z.object({
    userId: z.string().trim().min(1).max(MAX_SEARCH_LENGTH),
    reason: z.string().trim().max(MAX_BAN_REASON_LENGTH),
});

export const adminRoleInputSchema = z.object({
    userId: z.string().trim().min(1).max(MAX_SEARCH_LENGTH),
    isAdmin: z.boolean(),
});
