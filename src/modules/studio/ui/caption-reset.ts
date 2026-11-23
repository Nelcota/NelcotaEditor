import type { CaptionCue, CaptionWord, StudioDraft } from "#/modules/clips/clip-studio.schema";
import { replaceCueAt, resetAllCues, resetCue } from "#/modules/studio/ui/cue-editing";
import { toCueKey } from "#/modules/studio/ui/cue-key";

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

function isSameCue(first: CaptionCue, second: CaptionCue): boolean {
    return toCueKey(first) === toCueKey(second);
}

function isSameCueList(first: Array<CaptionCue>, second: Array<CaptionCue>): boolean {
    if (first.length !== second.length) {
        return false;
    }

    return first.every((cue, index) => {
        const other = second[index];

        return other !== undefined && isSameCue(cue, other);
    });
}

function settingsKey(draft: StudioDraft): string {
    const { cues: _cues, ...settings } = draft;

    return JSON.stringify(settings, Object.keys(settings).toSorted());
}

function isSameDraft(first: StudioDraft, second: StudioDraft): boolean {
    return settingsKey(first) === settingsKey(second) && isSameCueList(first.cues, second.cues);
}

/** Whether bringing every caption back would change anything. */
export function hasCaptionsToReset(draft: StudioDraft, words: Array<CaptionWord>): boolean {
    return isSameCueList(resetAllCues(draft, words).cues, draft.cues) === false;
}

/** Whether bringing this cue back would change anything. */
export function isCueChangedFromOriginal(cue: CaptionCue, words: Array<CaptionWord>): boolean {
    return isSameCue(resetCue(cue, words), cue) === false;
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
    if (isSameDraft(draft, before) === true) {
        return false;
    }

    return isSameDraft(draft, resetCaptions(before, words, reset));
}
