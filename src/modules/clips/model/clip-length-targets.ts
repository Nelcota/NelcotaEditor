import {
    IDEAL_MAX_CLIP_SECONDS,
    IDEAL_MIN_CLIP_SECONDS,
    MAX_CLIP_SECONDS,
} from "#/modules/clips/model/clip-limits";
import type { ClipLength } from "#/modules/video-records/model/clip-length";

export interface ClipLengthTarget {
    /** The range the AI is asked for. */
    minSeconds: number;
    maxSeconds: number;
    /** A chosen clip longer than this is trimmed at a word boundary. */
    trimAboveSeconds: number;
    /** When set, a clip shorter than `minSeconds` is extended toward this length. */
    aimSeconds: number | null;
}

// Every target stays inside the hard 15 to 90 s limits, which the Studio keeps for editing.
export const CLIP_LENGTH_TARGETS: Record<ClipLength, ClipLengthTarget> = {
    short: { minSeconds: 20, maxSeconds: 40, trimAboveSeconds: 40, aimSeconds: null },
    minute: { minSeconds: 55, maxSeconds: 65, trimAboveSeconds: 65, aimSeconds: 60 },
    free: {
        minSeconds: IDEAL_MIN_CLIP_SECONDS,
        maxSeconds: IDEAL_MAX_CLIP_SECONDS,
        trimAboveSeconds: MAX_CLIP_SECONDS,
        aimSeconds: null,
    },
};
