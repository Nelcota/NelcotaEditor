import type { CaptionWord, StudioDraft } from "#/modules/clips/clip-studio.schema";
import type { ClipView } from "#/modules/videos/video-views";

/** Everything the Studio needs to edit one clip, as the browser receives it. */
export interface ClipStudioView {
    clip: ClipView;
    /** What the clip's file was (or will be) rendered with. */
    applied: StudioDraft;
    /** Edits saved but not rendered yet; null when there are none. */
    draft: StudioDraft | null;
    draftVersion: number;
    /** The whole transcript, so captions can follow the clip when its start or end moves. */
    words: Array<CaptionWord>;
    /** Null when the duration was never measured. */
    videoDurationSeconds: number | null;
}

export type SaveDraftResult = { kind: "saved"; draftVersion: number } | { kind: "conflict" };

export type RenderDraftResult = { kind: "queued" } | { kind: "conflict" };
