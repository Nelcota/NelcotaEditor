import { queryOptions } from "@tanstack/react-query";
import { getAppSwitchStates } from "#/modules/app-switches/server/app-switch-functions";

export const APP_SWITCHES_QUERY_KEY = ["app-switches"] as const;

export function appSwitchStatesQueryOptions() {
    return queryOptions({
        queryKey: APP_SWITCHES_QUERY_KEY,
        queryFn: () => getAppSwitchStates(),
    });
}
