import { queryOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { EditSessionView } from "#/modules/viral-formats/model/edit-session";
import {
    getMyEditSession,
    listMyEditSessions,
} from "#/modules/viral-formats/server/edit-session-functions";

const EDIT_SESSIONS_QUERY_KEY = ["edit-sessions"] as const;
/** While a video is being prepared or an edit renders the page checks this often for the next step. */
const BUSY_CHECK_MILLISECONDS = 3000;
/** Claude may take hours to pick a batch up, so an open page waiting for it checks less often. */
const WAITING_FOR_CLAUDE_MILLISECONDS = 30_000;

function hasVideoBeingPrepared(session: EditSessionView): boolean {
    return session.videos.some((video) => video.isReady === false && video.hasFailed === false);
}

function hasEditRendering(session: EditSessionView): boolean {
    return session.edits.some((edit) => edit.status === "queued" || edit.status === "rendering");
}

/** A usable video of a queued batch that Claude has not edited yet; a failed one never will be. */
function isWaitingForClaude(session: EditSessionView): boolean {
    if (session.status !== "queued") {
        return false;
    }

    const editedVideoIds = new Set(session.edits.map((edit) => edit.videoId));

    return session.videos.some(
        (video) => video.hasFailed === false && editedVideoIds.has(video.id) === false,
    );
}

function toRefetchInterval(session: EditSessionView): number | false {
    if (hasVideoBeingPrepared(session) === true || hasEditRendering(session) === true) {
        return BUSY_CHECK_MILLISECONDS;
    }

    if (isWaitingForClaude(session) === true) {
        return WAITING_FOR_CLAUDE_MILLISECONDS;
    }

    return false;
}

export function editSessionQueryOptions(sessionId: string) {
    return queryOptions({
        queryKey: [...EDIT_SESSIONS_QUERY_KEY, sessionId],
        queryFn: () => getMyEditSession({ data: { sessionId } }),
        refetchInterval: (query) => {
            const session = query.state.data;

            if (session === null || session === undefined) {
                return false;
            }

            return toRefetchInterval(session);
        },
        refetchIntervalInBackground: false,
    });
}

export function myEditSessionsQueryOptions() {
    return queryOptions({
        queryKey: [...EDIT_SESSIONS_QUERY_KEY, "list"],
        queryFn: () => listMyEditSessions(),
    });
}

/** After a change to a batch: its page and the lists that count its videos. */
export async function invalidateEditSessionQueries(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: EDIT_SESSIONS_QUERY_KEY });
}
