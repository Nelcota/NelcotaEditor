import type { ClipView } from "#/modules/clips/model/clip-view";

export type StudioClipPick =
    | { kind: "found"; clip: ClipView }
    /** The address names a clip this video does not have (deleted, or a mistyped link). */
    | { kind: "missing"; bestClip: ClipView }
    /** The video has no clips yet. */
    | { kind: "none" };

/**
 * The clip the Studio opens: the one the address names, or the best when it names none. A named
 * clip that is gone is reported, never swapped for another one the person did not ask to edit.
 */
export function pickStudioClip(
    rankedClips: Array<ClipView>,
    clipId: string | undefined,
): StudioClipPick {
    const bestClip = rankedClips[0];

    if (bestClip === undefined) {
        return { kind: "none" };
    }

    if (clipId === undefined) {
        return { kind: "found", clip: bestClip };
    }

    const clip = rankedClips.find((candidate) => candidate.id === clipId);

    if (clip === undefined) {
        return { kind: "missing", bestClip };
    }

    return { kind: "found", clip };
}
