import { queryOptions } from "@tanstack/react-query";
import { getClaudeConnection } from "#/modules/auth/server/claude-connection-functions";

export const CLAUDE_CONNECTION_QUERY_KEY = ["claude-connection"] as const;

/** While nothing is connected, Etapa 1 checks every few seconds so it notices Claude arriving. */
const WAITING_CHECK_MILLISECONDS = 5000;

export function claudeConnectionQueryOptions() {
    return queryOptions({
        queryKey: CLAUDE_CONNECTION_QUERY_KEY,
        queryFn: () => getClaudeConnection(),
        refetchInterval: (query) => {
            const connection = query.state.data;

            if (connection === undefined || connection.connectedAt !== null) {
                return false;
            }

            return WAITING_CHECK_MILLISECONDS;
        },
        refetchIntervalInBackground: false,
    });
}
