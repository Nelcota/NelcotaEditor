import { useEffect, useState } from "react";
import type { VideoStatus } from "#/modules/video-records/model/video-status";

const MIN_REPLAY_DELAY_MILLISECONDS = 8_000;
const MAX_REPLAY_DELAY_MILLISECONDS = 12_000;
const REPLAY_DELAY_RANGE_MILLISECONDS =
    MAX_REPLAY_DELAY_MILLISECONDS - MIN_REPLAY_DELAY_MILLISECONDS;

function subscribeToGestureReplay(replay: () => void): () => void {
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

        const delay =
            MIN_REPLAY_DELAY_MILLISECONDS + Math.random() * REPLAY_DELAY_RANGE_MILLISECONDS;

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

export function useCrewGesture(status: VideoStatus, isWorking: boolean): number {
    const [gesture, setGesture] = useState(0);

    useEffect(() => {
        if (isWorking === false || status === "queued") {
            return undefined;
        }

        return subscribeToGestureReplay(() => setGesture((previous) => previous + 1));
    }, [isWorking, status]);

    return gesture;
}
