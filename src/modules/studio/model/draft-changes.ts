import type { CaptionCue, StudioDraft } from "#/modules/clips/model/clip-studio";
import { toCueKey } from "#/modules/studio/model/cue-key";

// One style pick (a preset) sets several of these at once, so the caption look counts as one change.
const CAPTION_LOOK_KEYS = [
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

/**
 * How many edits are not in the rendered file yet: the trim counts once, the format once, the
 * caption look once and each caption once.
 */
export function countDraftChanges(draft: StudioDraft, applied: StudioDraft): number {
    let settingChanges = 0;
    let trimChanges = 0;

    if (draft.aspectRatio !== applied.aspectRatio) {
        settingChanges += 1;
    }

    if (CAPTION_LOOK_KEYS.some((key) => draft[key] !== applied[key]) === true) {
        settingChanges += 1;
    }

    if (draft.startSeconds !== applied.startSeconds || draft.endSeconds !== applied.endSeconds) {
        trimChanges = 1;
    }

    return trimChanges + settingChanges + countCueChanges(draft.cues, applied.cues);
}
