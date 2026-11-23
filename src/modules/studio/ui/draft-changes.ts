import type { CaptionCue, StudioDraft } from "#/modules/clips/clip-studio.schema";
import { toCueKey } from "#/modules/studio/ui/cue-key";

const SETTING_KEYS = [
    "aspectRatio",
    "captionStyle",
    "captionColor",
    "captionSize",
    "captionPosition",
    "captionFont",
] as const;

/** Captions that are new, changed or gone, counted once each. */
function countCueChanges(draftCues: Array<CaptionCue>, appliedCues: Array<CaptionCue>): number {
    const appliedKeys = new Set(appliedCues.map(toCueKey));
    const draftKeys = new Set(draftCues.map(toCueKey));
    const added = [...draftKeys].filter((key) => appliedKeys.has(key) === false).length;
    const removed = [...appliedKeys].filter((key) => draftKeys.has(key) === false).length;

    return Math.max(added, removed);
}

/** How many edits are not in the rendered file yet: the trim counts once, each setting once. */
export function countDraftChanges(draft: StudioDraft, applied: StudioDraft): number {
    const settingChanges = SETTING_KEYS.filter((key) => draft[key] !== applied[key]).length;
    let trimChanges = 0;

    if (draft.startSeconds !== applied.startSeconds || draft.endSeconds !== applied.endSeconds) {
        trimChanges = 1;
    }

    return trimChanges + settingChanges + countCueChanges(draft.cues, applied.cues);
}
