import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { StudioDraft } from "#/modules/clips/model/clip-studio";
import type { SaveDraftResult } from "#/modules/studio/model/clip-studio-view";
import { saveClipDraft } from "#/modules/studio/server/clip-studio-functions";
import { clearDraftBackup, writeDraftBackup } from "#/modules/studio/client/draft-backup";
import {
    clipDraftLeaveSaveKey,
    clipStudioQueryOptions,
} from "#/modules/studio/model/studio-queries";
import { countDraftChanges } from "#/modules/studio/model/draft-changes";
import { useTrackPromise } from "#/shared/ui/use-track-promise";
import { useIsOnline } from "#/shared/ui/use-is-online";
import { reportClientProblem } from "#/shared/errors/report-client-problem";

// Long enough to group a burst of typing into one request, short enough to feel instant.
const SAVE_DELAY_MILLISECONDS = 800;
const SAVE_SCOPE_PREFIX = "studio-draft-save:";
// Each round saves what was typed during the one before; a person cannot outtype this many.
const MAX_FLUSH_ROUNDS = 5;

/**
 * A save sent as the page goes away must outlive it. Browsers without keepalive ignore the flag;
 * the edit is in the browser backup either way.
 */
const keepaliveFetch: typeof fetch = (input, init) => fetch(input, { ...init, keepalive: true });

type SaveDraftData = Parameters<typeof saveClipDraft>[0]["data"];

function sendDraft(data: SaveDraftData, transport: typeof fetch | null): Promise<SaveDraftResult> {
    if (transport === null) {
        return saveClipDraft({ data });
    }

    return saveClipDraft({ data, fetch: transport });
}

export type SaveStatus = "saved" | "saving" | "failed" | "offline" | "conflict";

/** How a flush ended: the server holds the current draft, or why it does not. */
export type FlushOutcome = "saved" | "conflict" | "failed";

/** One save; "changed" means it landed but the draft moved on while it was on its way. */
type SaveOutcome = FlushOutcome | "changed";

interface AutosaveInput {
    videoId: string;
    clipId: string;
    draft: StudioDraft;
    initialVersion: number;
    /** The version in the cached snapshot; it moves on when the snapshot is fetched again. */
    serverVersion: number;
    /** The draft the server already holds, so loading the Studio does not save it again. */
    savedDraft: StudioDraft;
}

export interface DraftAutosave {
    status: SaveStatus;
    /** The server version the next save builds on. */
    readVersion: () => number;
    /** Saves right away, again while edits keep arriving, until the server holds the draft. */
    flush: () => Promise<FlushOutcome>;
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

interface SavedDraft {
    videoId: string;
    clipId: string;
    draft: StudioDraft;
    draftVersion: number;
}

/**
 * The snapshot never refetches on its own, so a Studio reopened on it would start from the draft
 * and version it first loaded, hiding the saved edits and turning the next save into a conflict.
 */
function storeSavedDraft(queryClient: QueryClient, saved: SavedDraft): void {
    const queryKey = clipStudioQueryOptions(saved.videoId, saved.clipId).queryKey;

    queryClient.setQueryData(queryKey, (snapshot) => {
        if (snapshot === undefined) {
            return undefined;
        }

        return { ...snapshot, draft: saved.draft, draftVersion: saved.draftVersion };
    });
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

    // A refetch after a render (or after another tab saved what this one shows) brings a newer
    // version. Without unsaved edits here, the next save builds on it instead of meeting a
    // conflict the person never caused.
    const followServer = useEffectEvent((serverVersion: number, serverDraft: StudioDraft): void => {
        const current = draftRef.current;

        if (current !== savedDraftRef.current || serverVersion <= versionRef.current) {
            return;
        }

        if (countDraftChanges(current, serverDraft) === 0) {
            versionRef.current = serverVersion;
        }
    });

    useEffect(() => {
        followServer(input.serverVersion, input.savedDraft);
    }, [input.serverVersion, input.savedDraft]);

    const saveOnce = async (transport: typeof fetch | null): Promise<SaveOutcome> => {
        const current = draftRef.current;

        if (current === savedDraftRef.current) {
            setStatus("saved");
            return "saved";
        }

        setStatus("saving");

        try {
            const result = await sendDraft(
                { videoId, clipId, expectedVersion: versionRef.current, draft: current },
                transport,
            );

            if (result.kind === "conflict") {
                setStatus("conflict");
                return "conflict";
            }

            versionRef.current = result.draftVersion;
            savedDraftRef.current = current;
            storeSavedDraft(queryClient, {
                videoId,
                clipId,
                draft: current,
                draftVersion: result.draftVersion,
            });
            clearDraftBackup(clipId);
            setStatus("saved");

            if (draftRef.current !== current) {
                return "changed";
            }

            return "saved";
        } catch (error) {
            // The edits stay on screen and in this browser; the person can try again.
            reportClientProblem("Could not save the Studio draft", error);
            writeDraftBackup(clipId, { baseVersion: versionRef.current, draft: current });
            setStatus("failed");
            return "failed";
        }
    };

    // Mutations of one scope run one after another, so two callers never send the same expected
    // version (the server would call that a conflict). "always": offline, a save still runs and
    // fails into the browser backup instead of waiting, so flush() never hangs. saveOnce never
    // rejects.
    const saveMutation = useMutation({
        mutationFn: () => saveOnce(null),
        scope: { id: `${SAVE_SCOPE_PREFIX}${clipId}` },
        networkMode: "always",
    });
    // The same save under a key the Studio tab watches: reopening the clip before it lands would
    // start from the version it replaces.
    const leaveSaveMutation = useMutation({
        mutationKey: clipDraftLeaveSaveKey(videoId, clipId),
        mutationFn: () => saveOnce(null),
        scope: { id: `${SAVE_SCOPE_PREFIX}${clipId}` },
        networkMode: "always",
    });

    const flush = async (): Promise<FlushOutcome> => {
        for (let round = 0; round < MAX_FLUSH_ROUNDS; round += 1) {
            const outcome = await saveMutation.mutateAsync();

            if (outcome !== "changed") {
                return outcome;
            }
        }

        return "failed";
    };

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

        await leaveSaveMutation.mutateAsync();
    });

    useEffect(() => {
        return () => track(saveOnLeave());
    }, [track]);

    // Closing or reloading the tab skips both the delayed save and the unmount above; the edit
    // goes to the browser backup at once and to the server on a request that outlives the page.
    const hideSaveMutation = useMutation({
        mutationFn: () => saveOnce(keepaliveFetch),
        scope: { id: `${SAVE_SCOPE_PREFIX}${clipId}` },
        networkMode: "always",
    });

    const saveOnHide = useEffectEvent((): void => {
        const current = draftRef.current;

        if (current === savedDraftRef.current) {
            return;
        }

        writeDraftBackup(clipId, { baseVersion: versionRef.current, draft: current });
        hideSaveMutation.mutate();
    });

    useEffect(() => {
        const onPageHide = (): void => saveOnHide();
        const onVisibilityChange = (): void => {
            if (document.visibilityState === "hidden") {
                saveOnHide();
            }
        };

        window.addEventListener("pagehide", onPageHide);
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            window.removeEventListener("pagehide", onPageHide);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, []);

    const resync = (version: number, serverDraft: StudioDraft): void => {
        versionRef.current = version;
        savedDraftRef.current = serverDraft;
        // Made on the old version, the backup would raise the same conflict on the next visit.
        clearDraftBackup(clipId);
        setStatus("saved");
    };

    return {
        status: resolveStatus(status, isOnline),
        readVersion: () => versionRef.current,
        flush,
        resync,
    };
}
