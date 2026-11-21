import type { CaptionWord, StudioDraft } from "#/modules/clips/clip-studio.schema";
import type { ClipView } from "#/modules/clips/clip-view";

/** One clip's Studio state, as the server sends it. */
export interface ClipStudioState {
    clip: ClipView;
    /** What the clip's file was (or will be) rendered with. */
    applied: StudioDraft;
    /** Edits saved but not rendered yet; null when there are none. */
    draft: StudioDraft | null;
    draftVersion: number;
    /** Null when the duration was never measured. */
    videoDurationSeconds: number | null;
}

/**
 * Everything the Studio needs to edit one clip. The words come from their own request, once per
 * video: they are the whole transcript (megabytes on long videos) and the same for every clip.
 */
export interface ClipStudioView extends ClipStudioState {
    /** The whole transcript, so captions can follow the clip when its start or end moves. */
    words: Array<CaptionWord>;
}

export type SaveDraftResult = { kind: "saved"; draftVersion: number } | { kind: "conflict" };

export type RenderDraftResult = { kind: "queued" } | { kind: "conflict" };
