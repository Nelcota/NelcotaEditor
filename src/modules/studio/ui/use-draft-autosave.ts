import { useMutation } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { StudioDraft } from "#/modules/clips/clip-studio.schema";
import { saveClipDraft } from "#/modules/studio/server/clip-studio-functions";
import { clearDraftBackup, writeDraftBackup } from "#/modules/studio/ui/draft-backup";
import { useIsOnline } from "#/shared/ui/use-is-online";

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

/** Keeps the server's copy of the draft in step with the screen, quietly and in order. */
export function useDraftAutosave(input: AutosaveInput): DraftAutosave {
    const { videoId, clipId, draft } = input;
    const isOnline = useIsOnline();
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
            console.warn("Could not save the Studio draft", error);
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
        void flush();
    });

    useEffect(() => {
        if (draft === savedDraftRef.current) {
            return;
        }

        // Offline, the edits wait in this browser; reconnecting runs this again and saves them.
        if (isOnline === false) {
            writeDraftBackup(clipId, { baseVersion: versionRef.current, draft });
            return;
        }

        const timer = window.setTimeout(saveLater, SAVE_DELAY_MILLISECONDS);

        return () => window.clearTimeout(timer);
    }, [draft, isOnline, clipId]);

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
