interface PlaybackRange {
    startSeconds: number;
    endSeconds: number;
}

/** What playing the clip needs at this time: nothing, a jump to its start, or a stop there. */
export type PlaybackCorrection = "none" | "jumpToStart" | "rewindAndPause";

/**
 * Playback stays inside the clip, like the finished file. Past the end it stops back at the
 * start; before the start (the start was dragged past the playhead) it carries on from the start.
 */
export function findPlaybackCorrection(seconds: number, range: PlaybackRange): PlaybackCorrection {
    if (seconds >= range.endSeconds) {
        return "rewindAndPause";
    }

    if (seconds < range.startSeconds) {
        return "jumpToStart";
    }

    return "none";
}
