import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useReducer, useState } from "react";
import { studioDraftSchema } from "#/modules/clips/model/clip-studio";
import type { CaptionCue, StudioDraft } from "#/modules/clips/model/clip-studio";
import type { ClipStudioState, ClipStudioView } from "#/modules/studio/model/clip-studio-view";
import { renderClipDraft } from "#/modules/studio/server/clip-studio-functions";
import { clipStudioQueryKey, clipStudioQueryOptions } from "#/modules/studio/model/studio-queries";
import { replaceCueAt, resetAllCues } from "#/modules/studio/model/cue-editing";
import { readDraftBackup } from "#/modules/studio/client/draft-backup";
import { pickStartingDraft } from "#/modules/studio/model/pick-starting-draft";
import { countDraftChanges } from "#/modules/studio/model/draft-changes";
import { DraftNotSavedError } from "#/modules/studio/model/draft-not-saved-error";
import { trimDraft } from "#/modules/studio/model/draft-trim";
import { toClipStudioState } from "#/modules/studio/model/to-clip-studio-state";
import { createHistory, studioHistoryReducer } from "#/modules/studio/model/studio-history";
import { useDraftAutosave } from "#/modules/studio/ui/hooks/use-draft-autosave";
import type { DraftAutosave } from "#/modules/studio/ui/hooks/use-draft-autosave";
import { toErrorMessage } from "#/shared/ui/to-error-message";
import { invalidateVideoQueries } from "#/modules/videos/model/video-queries";

const HUNDREDTHS = 100;

/** Whisper's precision: dragging and key steps never leave 116.24000000001 behind. */
function roundTime(seconds: number): number {
    return Math.round(seconds * HUNDREDTHS) / HUNDREDTHS;
}

const INVALID_EDIT_MESSAGE = "Essa mudança não cabe nas regras do corte.";
const RENDER_FAILED_MESSAGE = "Não foi possível renderizar o corte. Tente novamente.";

type RenderOutcome = "queued" | "conflict" | "failed";

type DraftSettings = Omit<StudioDraft, "startSeconds" | "endSeconds" | "cues">;

export interface StudioEditor {
    draft: StudioDraft;
    applied: StudioDraft;
    changeCount: number;
    canUndo: boolean;
    canRedo: boolean;
    autosave: DraftAutosave;
    isSendingRender: boolean;
    renderError: string | null;
    /** Why the last edit was refused; null after an edit that went through. */
    editError: string | null;
    undo: () => void;
    redo: () => void;
    updateSettings: (settings: Partial<DraftSettings>) => void;
    trim: (startSeconds: number, endSeconds: number) => void;
    /** False when the edit was refused; editError says why. */
    replaceCue: (index: number, replacement: Array<CaptionCue>) => boolean;
    resetAllCaptions: () => void;
    render: () => Promise<RenderOutcome>;
    keepMine: () => Promise<void>;
    takeTheirs: () => Promise<void>;
}

/** Everything the Studio can do to one clip's draft, with undo, autosave and render. */
export function useStudioEditor(videoId: string, studio: ClipStudioView): StudioEditor {
    const queryClient = useQueryClient();
    const clipId = studio.clip.id;
    const savedDraft = studio.draft ?? studio.applied;
    const [start] = useState(() =>
        pickStartingDraft(
            { savedDraft, draftVersion: studio.draftVersion },
            readDraftBackup(clipId),
        ),
    );
    const [history, dispatch] = useReducer(studioHistoryReducer, start.draft, createHistory);
    const [editError, setEditError] = useState<string | null>(null);
    const draft = history.present;
    // The Studio re-renders every frame while playing; this compares every cue, so only redo it on edits.
    const changeCount = countDraftChanges(draft, studio.applied);
    const autosave = useDraftAutosave({
        videoId,
        clipId,
        draft,
        initialVersion: start.version,
        serverVersion: studio.draftVersion,
        savedDraft,
    });

    // A step that changes nothing (a click on the option already picked) must not fill the undo list.
    // A step the server would reject (a word too long, too many cues) is refused here with the
    // reason, instead of failing every autosave later with a generic message.
    const apply = (next: StudioDraft): boolean => {
        if (JSON.stringify(next) === JSON.stringify(draft)) {
            return true;
        }

        const validation = studioDraftSchema.safeParse(next);

        if (validation.success === false) {
            const firstIssue = validation.error.issues[0];
            setEditError(firstIssue?.message ?? INVALID_EDIT_MESSAGE);
            return false;
        }

        setEditError(null);
        dispatch({ type: "apply", draft: next });
        return true;
    };

    // Through the cache, so the Studio's applied draft moves on with it: a direct call left the
    // screen comparing against the old one, counting changes the other tab already rendered.
    const fetchLatest = async (): Promise<ClipStudioState> => {
        const snapshot = await queryClient.fetchQuery({
            ...clipStudioQueryOptions(videoId, clipId),
            staleTime: 0,
        });
        return toClipStudioState(snapshot, studio.words);
    };

    const sendRender = async (): Promise<RenderOutcome> => {
        const saveOutcome = await autosave.flush();

        if (saveOutcome === "conflict") {
            return "conflict";
        }

        // Rendering an older draft than the screen shows would surprise; say why nothing was sent.
        if (saveOutcome === "failed") {
            throw new DraftNotSavedError();
        }

        const result = await renderClipDraft({
            data: { videoId, clipId, expectedVersion: autosave.readVersion() },
        });

        if (result.kind === "conflict") {
            return "conflict";
        }

        // Rendering moved the version on and made this draft the applied one. The cached snapshot
        // must follow, or reopening the clip would start from the old version and conflict.
        autosave.resync(autosave.readVersion() + 1, draft);
        await Promise.all([
            invalidateVideoQueries(queryClient),
            queryClient.invalidateQueries({ queryKey: clipStudioQueryKey(videoId, clipId) }),
        ]);
        return "queued";
    };

    // "always": offline, the request fails at once with a message instead of waiting paused and
    // sending later, perhaps after the person left the Studio.
    const renderMutation = useMutation({ mutationFn: sendRender, networkMode: "always" });

    // A thrown error stays in the mutation and shows as renderError; the caller only needs the outcome.
    const render = async (): Promise<RenderOutcome> => {
        try {
            return await renderMutation.mutateAsync();
        } catch (error) {
            if (error instanceof Error) {
                return "failed";
            }

            throw error;
        }
    };

    let renderError: string | null = null;

    if (renderMutation.isError === true) {
        renderError = toErrorMessage(renderMutation.error, RENDER_FAILED_MESSAGE);
    }

    const keepMine = async (): Promise<void> => {
        const latest = await fetchLatest();
        autosave.resync(latest.draftVersion, latest.draft ?? latest.applied);
        await autosave.flush();
    };

    const takeTheirs = async (): Promise<void> => {
        const latest = await fetchLatest();
        const theirs = latest.draft ?? latest.applied;
        autosave.resync(latest.draftVersion, theirs);
        dispatch({ type: "replace", draft: theirs });
    };

    return {
        draft,
        applied: studio.applied,
        changeCount,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        autosave,
        isSendingRender: renderMutation.isPending,
        renderError,
        editError,
        undo: () => dispatch({ type: "undo" }),
        redo: () => dispatch({ type: "redo" }),
        updateSettings: (settings) => apply({ ...draft, ...settings }),
        trim: (startSeconds, endSeconds) =>
            apply(
                trimDraft(
                    draft,
                    { startSeconds: roundTime(startSeconds), endSeconds: roundTime(endSeconds) },
                    studio.words,
                ),
            ),
        replaceCue: (index, replacement) => apply(replaceCueAt(draft, index, replacement)),
        resetAllCaptions: () => apply(resetAllCues(draft, studio.words)),
        render,
        keepMine,
        takeTheirs,
    };
}
