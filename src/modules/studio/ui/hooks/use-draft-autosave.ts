import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { StudioDraft } from "#/modules/clips/model/clip-studio";
import { saveClipDraft } from "#/modules/studio/server/clip-studio-functions";
import { clearDraftBackup, writeDraftBackup } from "#/modules/studio/client/draft-backup";
import { clipStudioQueryKey } from "#/modules/studio/model/studio-queries";
import { useTrackPromise } from "#/shared/ui/use-track-promise";
import { useIsOnline } from "#/shared/ui/use-is-online";
import { reportClientProblem } from "#/shared/errors/report-client-problem";

// Long enough to group a burst of typing into one request, short enough to feel instant.
const SAVE_DELAY_MILLISECONDS = 800;
const SAVE_SCOPE_PREFIX = "studio-draft-save:";

export type SaveStatus = "saved" | "saving" | "failed" | "offline" | "conflict";

interface AutosaveInput {
    videoId: string;
    clipId: string;
    draft: StudioDraft;
    initialVersion: number;
    /** The draft the server already holds, so loading the Studio does not save it again. */
    savedDraft: StudioDraft;
}

export interface DraftAutosave {
    status: SaveStatus;
    /** The server version the next save builds on. */
    readVersion: () => number;
    /** Saves right away; resolves to whether the server now holds the current draft. */
    flush: () => Promise<boolean>;
    /** Takes the server's latest version as the base; a draft that differs is saved over it next. */
    resync: (version: number, serverDraft: StudioDraft) => void;
}

/** Offline wins over the last save's outcome: nothing can reach the server until it is back. */
function resolveStatus(status: SaveStatus, isOnline: boolean): SaveStatus {
    if (isOnline === false && status !== "conflict") {
        return "offline";
    }

    return status;
}

/**
 * The snapshot never refetches on its own, so after the Studio closes it would reopen on the
 * draft and version it first loaded, hiding the saved edits and turning the next save into a
 * conflict. A Studio still showing the clip keeps it.
 */
function forgetUnusedSnapshot(queryClient: QueryClient, queryKey: Array<string>): void {
    const query = queryClient.getQueryCache().find({ queryKey, exact: true });

    if (query === undefined || query.getObserversCount() > 0) {
        return;
    }

    queryClient.removeQueries({ queryKey, exact: true });
}

/** Keeps the server's copy of the draft in step with the screen, quietly and in order. */
export function useDraftAutosave(input: AutosaveInput): DraftAutosave {
    const { videoId, clipId, draft } = input;
    const isOnline = useIsOnline();
    const queryClient = useQueryClient();
    const track = useTrackPromise();
    const [status, setStatus] = useState<SaveStatus>("saved");
    const versionRef = useRef(input.initialVersion);
    const savedDraftRef = useRef(input.savedDraft);
    const draftRef = useRef(draft);

    useEffect(() => {
        draftRef.current = draft;
    }, [draft]);

    const saveOnce = async (): Promise<boolean> => {
        const current = draftRef.current;

        if (current === savedDraftRef.current) {
            setStatus("saved");
            return true;
        }

        setStatus("saving");

        try {
            const result = await saveClipDraft({
                data: { videoId, clipId, expectedVersion: versionRef.current, draft: current },
            });

            if (result.kind === "conflict") {
                setStatus("conflict");
                return false;
            }

            versionRef.current = result.draftVersion;
            savedDraftRef.current = current;
            clearDraftBackup(clipId);
            setStatus("saved");
            return draftRef.current === current;
        } catch (error) {
            // The edits stay on screen and in this browser; the person can try again.
            reportClientProblem("Could not save the Studio draft", error);
            writeDraftBackup(clipId, { baseVersion: versionRef.current, draft: current });
            setStatus("failed");
            return false;
        }
    };

    // Mutations of one scope run one after another, so two callers never send the same expected
    // version (the server would call that a conflict). "always": offline, a save still runs and
    // fails into the browser backup instead of waiting, so flush() never hangs. saveOnce never
    // rejects.
    const saveMutation = useMutation({
        mutationFn: saveOnce,
        scope: { id: `${SAVE_SCOPE_PREFIX}${clipId}` },
        networkMode: "always",
    });

    const flush = (): Promise<boolean> => saveMutation.mutateAsync();

    const saveLater = useEffectEvent((): void => {
        saveMutation.mutate();
    });

    useEffect(() => {
        if (draft === savedDraftRef.current) {
            return undefined;
        }

        // Offline, the edits wait in this browser; reconnecting runs this again and saves them.
        if (isOnline === false) {
            writeDraftBackup(clipId, { baseVersion: versionRef.current, draft });
            return undefined;
        }

        const timer = window.setTimeout(saveLater, SAVE_DELAY_MILLISECONDS);

        return () => window.clearTimeout(timer);
    }, [draft, isOnline, clipId]);

    // Switching clips or going back to Cortes unmounts the Studio before the delayed save runs.
    // The edit is kept in this browser first, in case the save that follows never arrives.
    const saveOnLeave = useEffectEvent(async (): Promise<void> => {
        const current = draftRef.current;

        if (current !== savedDraftRef.current) {
            writeDraftBackup(clipId, { baseVersion: versionRef.current, draft: current });
        }

        await saveMutation.mutateAsync();
        forgetUnusedSnapshot(queryClient, clipStudioQueryKey(videoId, clipId));
    });

    useEffect(() => {
        return () => track(saveOnLeave());
    }, [track]);

    const resync = (version: number, serverDraft: StudioDraft): void => {
        versionRef.current = version;
        savedDraftRef.current = serverDraft;
        setStatus("saved");
    };

    return {
        status: resolveStatus(status, isOnline),
        readVersion: () => versionRef.current,
        flush,
        resync,
    };
}
