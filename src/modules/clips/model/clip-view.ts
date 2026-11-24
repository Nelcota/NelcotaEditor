import type { AspectRatio, CaptionStyle } from "#/modules/clips/model/clip-format";
import type { ClipStatus } from "#/modules/clips/model/clip-status";

/** What the browser receives about a clip. */
export interface ClipView {
    id: string;
    position: number;
    title: string;
    reason: string;
    startSeconds: number;
    endSeconds: number;
    score: number;
    status: ClipStatus;
    aspectRatio: AspectRatio;
    captionStyle: CaptionStyle;
    fileUrl: string | null;
    downloadUrl: string | null;
    /** Where anyone with the link can watch it; null while the clip is not shared. */
    sharePath: string | null;
}
