import { ADMIN_PAGE_SIZE, MAX_ADMIN_PAGE } from "#/modules/admin/model/admin-search";

/** How many admin list pages hold this many rows; an empty list still has its one page. */
export function countAdminPages(totalCount: number): number {
    if (Number.isSafeInteger(totalCount) === false || totalCount < 0) {
        throw new RangeError(`Cannot count pages for ${totalCount} rows`);
    }

    return Math.min(MAX_ADMIN_PAGE, Math.max(Math.ceil(totalCount / ADMIN_PAGE_SIZE), 1));
}
