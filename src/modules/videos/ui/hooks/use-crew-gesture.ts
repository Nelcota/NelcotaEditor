import { useEffect, useState } from "react";
import type { VideoStatus } from "#/modules/video-records/model/video-status";

const REPLAY_DELAYS_MILLISECONDS = {
    inline: { minimum: 8_000, maximum: 12_000 },
    panel: { minimum: 3_000, maximum: 4_000 },
};

export type CrewGestureContext = keyof typeof REPLAY_DELAYS_MILLISECONDS;

function subscribeToGestureReplay(replay: () => void, context: CrewGestureContext): () => void {
    const { minimum, maximum } = REPLAY_DELAYS_MILLISECONDS[context];
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let timer: number | null = null;

    function canReplay(): boolean {
        return motion.matches && document.hidden === false;
    }

    function clearTimer(): void {
        if (timer === null) {
            return;
        }

        window.clearTimeout(timer);
        timer = null;
    }

    function scheduleReplay(): void {
        clearTimer();

        if (canReplay() === false) {
            return;
        }

        const delay = minimum + Math.random() * (maximum - minimum);

        timer = window.setTimeout((): void => {
            if (canReplay() === true) {
                replay();
            }

            scheduleReplay();
        }, delay);
    }

    scheduleReplay();
    document.addEventListener("visibilitychange", scheduleReplay);
    motion.addEventListener("change", scheduleReplay);

    return () => {
        clearTimer();
        document.removeEventListener("visibilitychange", scheduleReplay);
        motion.removeEventListener("change", scheduleReplay);
    };
}

export function useCrewGesture(
    status: VideoStatus,
    isWorking: boolean,
    context: CrewGestureContext,
): number {
    const [gesture, setGesture] = useState(0);

    useEffect(() => {
        if (isWorking === false || status === "queued") {
            return undefined;
        }

        return subscribeToGestureReplay(() => setGesture((previous) => previous + 1), context);
    }, [context, isWorking, status]);

    return gesture;
}
