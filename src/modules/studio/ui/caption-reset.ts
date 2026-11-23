import type { CaptionCue, CaptionWord, StudioDraft } from "#/modules/clips/clip-studio.schema";
import { replaceCueAt, resetAllCues, resetCue } from "#/modules/studio/ui/cue-editing";

/** Which captions "Voltar ao original" brings back to the transcript. */
export type CaptionReset = { scope: "all" } | { scope: "cue"; index: number };

/** The draft after a reset, built the same way the editor builds it. */
export function resetCaptions(
    draft: StudioDraft,
    words: Array<CaptionWord>,
    reset: CaptionReset,
): StudioDraft {
    if (reset.scope === "all") {
        return resetAllCues(draft, words);
    }

    const cue = draft.cues[reset.index];

    if (cue === undefined) {
        return draft;
    }

    return replaceCueAt(draft, reset.index, [resetCue(cue, words)]);
}

/** Whether bringing every caption back would change anything. */
export function hasCaptionsToReset(draft: StudioDraft, words: Array<CaptionWord>): boolean {
    return JSON.stringify(resetAllCues(draft, words).cues) !== JSON.stringify(draft.cues);
}

/** Whether bringing this cue back would change anything. */
export function isCueChangedFromOriginal(cue: CaptionCue, words: Array<CaptionWord>): boolean {
    return JSON.stringify(resetCue(cue, words)) !== JSON.stringify(cue);
}

/**
 * Whether the draft is still exactly what the reset made of `before`, so one undo step brings the
 * person's edits back. Any later edit hides the offer; undoing that edit shows it again.
 */
export function canUndoReset(
    draft: StudioDraft,
    before: StudioDraft,
    words: Array<CaptionWord>,
    reset: CaptionReset,
): boolean {
    const current = JSON.stringify(draft);

    if (current === JSON.stringify(before)) {
        return false;
    }

    return current === JSON.stringify(resetCaptions(before, words, reset));
}
