// Statuses move while the admin watches, but the overview counts every user, video and clip on each
// refresh, so a minute is enough; hidden tabs never poll, and coming back to the tab refetches stale data.
const ADMIN_REFRESH_MILLISECONDS = 60 * 1000;

/** Kept apart from the query options so tests can read it without loading the server functions. */
export const ADMIN_POLLING_OPTIONS = {
    refetchInterval: ADMIN_REFRESH_MILLISECONDS,
    refetchIntervalInBackground: false,
};
