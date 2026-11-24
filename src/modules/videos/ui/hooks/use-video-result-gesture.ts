import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { VideoSummary } from "#/modules/videos/model/video-views";

type ResultStatus = "done" | "failed";

interface ResultGesture {
    frames: Keyframe[];
    duration: number;
}

const RESULT_GESTURES: Record<ResultStatus, ResultGesture> = {
    done: {
        duration: 640,
        frames: [
            { transform: "none", offset: 0 },
            { transform: "scale(1.04, 0.95)", offset: 0.2 },
            { transform: "translateY(-8%) rotate(-5deg) scale(1.03, 1.06)", offset: 0.44 },
            { transform: "rotate(2deg) scale(1.02, 0.98)", offset: 0.76 },
            { transform: "none", offset: 1 },
        ],
    },
    failed: {
        duration: 520,
        frames: [
            { transform: "none", offset: 0 },
            { transform: "rotate(-5deg)", offset: 0.26 },
            { transform: "rotate(4deg)", offset: 0.58 },
            { transform: "rotate(-1.5deg)", offset: 0.82 },
            { transform: "none", offset: 1 },
        ],
    },
};

function playGesture(mascot: HTMLSpanElement, status: ResultStatus): (() => void) | undefined {
    const { frames, duration } = RESULT_GESTURES[status];
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");

    if (motion.matches === false) {
        return undefined;
    }

    const animation = mascot.animate(frames, { duration, easing: "ease-in-out", iterations: 1 });
    const cancel = (): void => animation.cancel();
    motion.addEventListener("change", cancel, { once: true });

    return () => {
        motion.removeEventListener("change", cancel);
        cancel();
    };
}

export function useVideoResultGesture(
    { id, status }: Pick<VideoSummary, "id" | "status">,
    result: ResultStatus,
): RefObject<HTMLSpanElement | null> {
    const mascotRef = useRef<HTMLSpanElement>(null);
    const previous = useRef({ id, status });

    useEffect(() => {
        const observed = previous.current;
        const mascot = mascotRef.current;
        previous.current = { id, status };

        if (
            status !== result ||
            observed.id !== id ||
            observed.status === result ||
            mascot === null
        ) {
            return undefined;
        }

        return playGesture(mascot, status);
    }, [id, result, status]);

    return mascotRef;
}
