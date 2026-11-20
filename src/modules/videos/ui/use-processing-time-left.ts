import { useEffect, useState } from "react";

const TICK_MILLISECONDS = 5_000;
const MILLISECONDS_PER_SECOND = 1_000;
const PERCENT = 100;
// Below this the pace is mostly noise (queue wait, download start), so no estimate is shown.
const MIN_PERCENT_FOR_ESTIMATE = 5;

/** The current time, ticking; null on the server and the first render, so hydration matches. */
function useNow(): number | null {
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        const tick = (): void => setNow(Date.now());
        const firstTick = setTimeout(tick, 0);
        const interval = setInterval(tick, TICK_MILLISECONDS);

        return () => {
            clearTimeout(firstTick);
            clearInterval(interval);
        };
    }, []);

    return now;
}

/** The pace so far, stretched over what is left; null when there is no pace to trust. */
function estimateSecondsLeft(elapsedSeconds: number, progressPercent: number): number | null {
    if (Number.isFinite(progressPercent) === false || Number.isFinite(elapsedSeconds) === false) {
        return null;
    }

    // A clock behind the server's makes the video look created in the future.
    if (elapsedSeconds <= 0) {
        return null;
    }

    // The minimum also keeps the division away from zero.
    if (progressPercent < MIN_PERCENT_FOR_ESTIMATE || progressPercent >= PERCENT) {
        return null;
    }

    return (elapsedSeconds * (PERCENT - progressPercent)) / progressPercent;
}

/**
 * Seconds left for the whole video, from how fast it has gone since it was created. It counts any
 * time spent waiting in the queue, so it errs on the long side ("cerca de").
 */
export function useProcessingTimeLeft(createdAt: string, progressPercent: number): number | null {
    const now = useNow();
    const startedAt = new Date(createdAt).getTime();

    if (now === null || Number.isNaN(startedAt) === true) {
        return null;
    }

    return estimateSecondsLeft((now - startedAt) / MILLISECONDS_PER_SECOND, progressPercent);
}
