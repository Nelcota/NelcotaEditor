import { useRef, useState } from "react";
import type { RefObject } from "react";
import type { ClipView } from "#/modules/clips/clip-view";
import { findClipAt } from "#/modules/videos/ui/clip-ranking";

interface ClipStudio {
    playerRef: RefObject<HTMLVideoElement | null>;
    currentSeconds: number;
    /** Undefined only while there are no clips yet. */
    selectedClip: ClipView | undefined;
    seek: (seconds: number) => void;
    selectClip: (clip: ClipView) => void;
    followPlayback: (seconds: number) => void;
}

/** Keeps the original's position and the clip shown beside it in step with each other. */
export function useClipStudio(rankedClips: Array<ClipView>): ClipStudio {
    const playerRef = useRef<HTMLVideoElement>(null);
    const [chosenClipId, setChosenClipId] = useState<string | null>(null);
    const [currentSeconds, setCurrentSeconds] = useState(0);
    const selectedClip = rankedClips.find((clip) => clip.id === chosenClipId) ?? rankedClips[0];

    const seek = (seconds: number): void => {
        const player = playerRef.current;
        setCurrentSeconds(seconds);

        if (player === null) {
            return;
        }

        player.currentTime = seconds;
    };

    // Playing the original into a clip's stretch makes that clip the one shown beside it.
    const followPlayback = (seconds: number): void => {
        const clipHere = findClipAt(rankedClips, seconds);
        setCurrentSeconds(seconds);

        if (clipHere === undefined) {
            return;
        }

        setChosenClipId(clipHere.id);
    };

    const selectClip = (clip: ClipView): void => {
        setChosenClipId(clip.id);
        seek(clip.startSeconds);
    };

    return { playerRef, currentSeconds, selectedClip, seek, selectClip, followPlayback };
}
