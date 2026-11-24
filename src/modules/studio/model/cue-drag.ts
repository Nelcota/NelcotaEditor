import type { CaptionCue, StudioDraft } from "#/modules/clips/model/clip-studio";
import { MIN_CUE_SECONDS, cueLimits, retimeCue } from "#/modules/studio/model/cue-editing";
import { clamp } from "#/modules/studio/client/timeline-geometry";

/** A dragged cue side is named "<cue index>:<side>", the edge key the drag hook works with. */
const EDGE_PATTERN = /^(\d+):(start|end)$/;

interface CueEdge {
    index: number;
    side: "start" | "end";
}

interface DraggedSide extends CueEdge {
    seconds: number;
}

export function parseEdge(edge: string): CueEdge | null {
    const match = EDGE_PATTERN.exec(edge);

    if (match === null) {
        return null;
    }

    const side = match[2];

    if (side !== "start" && side !== "end") {
        return null;
    }

    return { index: Number(match[1]), side };
}

/** The new edges of a cue when one side moves, kept between its neighbours. */
export function movedCue(draft: StudioDraft, edge: CueEdge, seconds: number): CaptionCue | null {
    const cue = draft.cues[edge.index];

    if (cue === undefined) {
        return null;
    }

    const limits = cueLimits(draft, edge.index);

    if (edge.side === "start") {
        const start = clamp(seconds, limits.min, cue.endSeconds - MIN_CUE_SECONDS);
        return retimeCue(cue, start, cue.endSeconds);
    }

    const end = clamp(seconds, cue.startSeconds + MIN_CUE_SECONDS, limits.max);
    return retimeCue(cue, cue.startSeconds, end);
}

/** The dragged side, parsed once per render instead of once per cue. */
export function parseActiveEdge(
    active: { edge: string; seconds: number } | null,
): DraggedSide | null {
    if (active === null) {
        return null;
    }

    const parsed = parseEdge(active.edge);

    if (parsed === null) {
        return null;
    }

    return { ...parsed, seconds: active.seconds };
}

/** The cue as it looks right now: moved live while one of its sides is dragged. */
export function shownCue(
    draft: StudioDraft,
    index: number,
    dragged: DraggedSide | null,
): CaptionCue | undefined {
    const cue = draft.cues[index];

    if (dragged === null || cue === undefined || dragged.index !== index) {
        return cue;
    }

    return movedCue(draft, dragged, dragged.seconds) ?? cue;
}
