import type { ClipView } from "#/modules/clips/model/clip-view";
import { findClipAt } from "#/modules/videos/model/clip-ranking";

/**
 * The clip to show beside the original at this position. Clips can overlap, so the one already
 * shown stays while the playhead is still inside it; otherwise picking a lower ranked clip would
 * snap back to the higher ranked one it overlaps.
 */
export function pickClipToFollow(
    rankedClips: Array<ClipView>,
    currentClipId: string | null,
    seconds: number,
): ClipView | undefined {
    const currentClip = rankedClips.find((clip) => clip.id === currentClipId);

    if (currentClip !== undefined && findClipAt([currentClip], seconds) !== undefined) {
        return currentClip;
    }

    return findClipAt(rankedClips, seconds);
}
