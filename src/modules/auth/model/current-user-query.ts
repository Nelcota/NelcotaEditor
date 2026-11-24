import { queryOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "#/modules/auth/server/get-current-user";

export const CURRENT_USER_QUERY_KEY = ["current-user"];
// Within this window, moving between screens does not wait for a round trip just to learn who is
// signed in. Kept short: a sign-out or account switch in another tab shows up within 30 s.
const CURRENT_USER_STALE_MILLISECONDS = 30 * 1000;

export function currentUserQueryOptions() {
    return queryOptions({
        queryKey: CURRENT_USER_QUERY_KEY,
        queryFn: () => getCurrentUser(),
        staleTime: CURRENT_USER_STALE_MILLISECONDS,
    });
}

/** After the profile changes (name, photo): drop the cached user so the next read is fresh. */
export async function forgetCurrentUser(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY, refetchType: "none" });
}
