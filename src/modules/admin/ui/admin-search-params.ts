/** An empty search stays out of the URL. */
export function toQuerySearch(query: string | undefined): string | undefined {
    if (query === undefined || query.trim().length === 0) {
        return undefined;
    }

    return query.trim();
}

/** The first page stays out of the URL. */
export function toPageSearch(page: number | undefined): number | undefined {
    if (page === undefined || page <= 1) {
        return undefined;
    }

    return page;
}
