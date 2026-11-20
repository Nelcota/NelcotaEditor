import { setTimeout as sleep } from "node:timers/promises";

const FLUSH_INTERVAL_MILLISECONDS = 1_000;
const MIN_PERCENT = 0;
const MAX_PERCENT = 100;

/** A failed save, kept so it is reported after the work instead of becoming an unhandled rejection. */
interface FlushFailure {
    error: unknown;
}

interface FlushLoopOptions {
    readLatestPercent: () => number | null;
    save: (percent: number) => Promise<void>;
    signal: AbortSignal;
}

/** Tools print odd values now and then (NaN, 100.4); only a whole 0–100 number is saved. */
function toSavablePercent(percent: number): number | null {
    if (Number.isFinite(percent) === false) {
        return null;
    }

    return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, Math.round(percent)));
}

/** Saves the latest percent once per interval until aborted; the last pass saves the final value. */
async function flushUntilAborted(options: FlushLoopOptions): Promise<void> {
    let savedPercent: number | null = null;

    while (options.signal.aborted === false) {
        await sleep(FLUSH_INTERVAL_MILLISECONDS);
        const latestPercent = options.readLatestPercent();

        if (latestPercent !== null && latestPercent !== savedPercent) {
            savedPercent = latestPercent;
            await options.save(latestPercent);
        }
    }
}

async function captureFailure(promise: Promise<void>): Promise<FlushFailure | null> {
    try {
        await promise;
        return null;
    } catch (error) {
        return { error };
    }
}

/**
 * Runs `work`, which may report progress (0–100) as often as it likes, and saves the latest
 * value at most once per second. Tools like yt-dlp print progress many times per second;
 * writing each one to the database would be wasteful.
 */
export async function runWithProgress<Result>(
    work: (report: (percent: number) => void) => Promise<Result>,
    save: (percent: number) => Promise<void>,
): Promise<Result> {
    let latestPercent: number | null = null;
    const workFinished = new AbortController();
    const flushing = captureFailure(
        flushUntilAborted({
            readLatestPercent: () => latestPercent,
            save,
            signal: workFinished.signal,
        }),
    );
    const report = (percent: number): void => {
        latestPercent = toSavablePercent(percent) ?? latestPercent;
    };

    let flushFailure: FlushFailure | null = null;
    let result: Result;

    try {
        result = await work(report);
    } finally {
        workFinished.abort();
        flushFailure = await flushing;
    }

    if (flushFailure !== null) {
        throw flushFailure.error;
    }

    return result;
}
