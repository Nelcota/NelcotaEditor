import { useQueryClient } from "@tanstack/react-query";
import { useReducer, useState } from "react";
import type { CaptionCue, StudioDraft } from "#/modules/clips/clip-studio.schema";
import type { ClipStudioView } from "#/modules/videos/clip-studio-view";
import { getClipStudio, renderClipDraft } from "#/modules/videos/server/clip-studio-functions";
import { replaceCueAt, resetAllCues } from "#/modules/videos/ui/studio/cue-editing";
import { readDraftBackup } from "#/modules/videos/ui/studio/draft-backup";
import { countDraftChanges } from "#/modules/videos/ui/studio/draft-changes";
import { trimDraft } from "#/modules/videos/ui/studio/draft-trim";
import { createHistory, studioHistoryReducer } from "#/modules/videos/ui/studio/studio-history";
import { useDraftAutosave } from "#/modules/videos/ui/studio/use-draft-autosave";
import type { DraftAutosave } from "#/modules/videos/ui/studio/use-draft-autosave";
import { toErrorMessage } from "#/modules/videos/ui/to-error-message";
import { VIDEOS_QUERY_KEY } from "#/modules/videos/ui/video-queries";

const HUNDREDTHS = 100;

/** Whisper's precision: dragging and key steps never leave 116.24000000001 behind. */
function roundTime(seconds: number): number {
    return Math.round(seconds * HUNDREDTHS) / HUNDREDTHS;
}

const RENDER_FAILED_MESSAGE = "Não foi possível enviar o corte para a Brasa. Tente novamente.";

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
    undo: () => void;
    redo: () => void;
    updateSettings: (settings: Partial<DraftSettings>) => void;
    trim: (startSeconds: number, endSeconds: number) => void;
    replaceCue: (index: number, replacement: Array<CaptionCue>) => void;
    resetAllCaptions: () => void;
    render: () => Promise<"queued" | "conflict" | "failed">;
    keepMine: () => Promise<void>;
    takeTheirs: () => Promise<void>;
}

/** The newest edits: a backup made on top of the server's version wins, then the saved draft. */
function pickStartingDraft(studio: ClipStudioView): StudioDraft {
    const backup = readDraftBackup(studio.clip.id);

    if (backup !== null && backup.baseVersion === studio.draftVersion) {
        return backup.draft;
    }

    return studio.draft ?? studio.applied;
}

/** Everything the Studio can do to one clip's draft, with undo, autosave and render. */
export function useStudioEditor(videoId: string, studio: ClipStudioView): StudioEditor {
    const queryClient = useQueryClient();
    const clipId = studio.clip.id;
    const savedDraft = studio.draft ?? studio.applied;
    const [history, dispatch] = useReducer(studioHistoryReducer, studio, (initial) =>
        createHistory(pickStartingDraft(initial)),
    );
    const [isSendingRender, setIsSendingRender] = useState(false);
    const [renderError, setRenderError] = useState<string | null>(null);
    const draft = history.present;
    const autosave = useDraftAutosave({
        videoId,
        clipId,
        draft,
        initialVersion: studio.draftVersion,
        savedDraft,
    });

    // A step that changes nothing (a click on the option already picked) must not fill the undo list.
    const apply = (next: StudioDraft): void => {
        if (JSON.stringify(next) === JSON.stringify(draft)) {
            return;
        }

        dispatch({ type: "apply", draft: next });
    };

    const fetchLatest = async (): Promise<ClipStudioView> =>
        getClipStudio({ data: { videoId, clipId } });

    const render = async (): Promise<"queued" | "conflict" | "failed"> => {
        setRenderError(null);
        setIsSendingRender(true);

        try {
            const isSaved = await autosave.flush();

            if (isSaved === false) {
                return "failed";
            }

            const result = await renderClipDraft({
                data: { videoId, clipId, expectedVersion: autosave.readVersion() },
            });

            if (result.kind === "conflict") {
                return "conflict";
            }

            // Rendering moved the version on and made this draft the applied one.
            autosave.resync(autosave.readVersion() + 1, draft);
            await queryClient.invalidateQueries({ queryKey: VIDEOS_QUERY_KEY });
            return "queued";
        } catch (error) {
            setRenderError(toErrorMessage(error, RENDER_FAILED_MESSAGE));
            return "failed";
        } finally {
            setIsSendingRender(false);
        }
    };

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
        changeCount: countDraftChanges(draft, studio.applied),
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        autosave,
        isSendingRender,
        renderError,
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
