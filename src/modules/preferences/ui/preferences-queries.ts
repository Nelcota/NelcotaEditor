import { queryOptions } from "@tanstack/react-query";
import { getPreferences } from "#/modules/preferences/server/preferences-functions";

export const PREFERENCES_QUERY_KEY = ["preferences"];

export function preferencesQueryOptions() {
    return queryOptions({
        queryKey: PREFERENCES_QUERY_KEY,
        queryFn: () => getPreferences(),
    });
}
