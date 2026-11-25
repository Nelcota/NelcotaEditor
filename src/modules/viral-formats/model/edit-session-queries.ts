import { queryOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { EditSessionView } from "#/modules/viral-formats/model/edit-session";
import {
    getMyEditSession,
    listMyEditSessions,
} from "#/modules/viral-formats/server/edit-session-functions";

const EDIT_SESSIONS_QUERY_KEY = ["edit-sessions"] as const;
/** While a video is being prepared or edited the page checks this often for the next step. */
const BUSY_CHECK_MILLISECONDS = 3000;

function hasVideoBeingPrepared(session: EditSessionView): boolean {
    return session.videos.some((video) => video.isReady === false && video.hasFailed === false);
}

function hasEditUnderWay(session: EditSessionView): boolean {
    if (session.status !== "queued") {
        return false;
    }

    const finishedVideoIds = new Set(
        session.edits
            .filter((edit) => edit.status === "done" || edit.status === "failed")
            .map((edit) => edit.videoId),
    );

    return session.videos.some((video) => finishedVideoIds.has(video.id) === false);
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

            if (hasVideoBeingPrepared(session) === false && hasEditUnderWay(session) === false) {
                return false;
            }

            return BUSY_CHECK_MILLISECONDS;
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
