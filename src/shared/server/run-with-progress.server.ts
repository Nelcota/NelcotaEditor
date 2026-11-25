import { setTimeout as sleep } from "node:timers/promises";
import { logger } from "#/shared/server/logger.server";

const FLUSH_INTERVAL_MILLISECONDS = 1_000;
const MIN_PERCENT = 0;
const MAX_PERCENT = 100;
// At one save a second, about one line every half minute while the database stays down.
const LOG_EVERY_CONSECUTIVE_FAILURES = 30;

/** Wrapped, since a rejection may carry any value, null included. */
interface SaveFailure {
    error: unknown;
}

interface FlushLoopOptions {
    readLatestPercent: () => number | null;
    save: (percent: number) => Promise<void>;
    signal: AbortSignal;
}

interface FlushState {
    savedPercent: number | null;
    consecutiveFailures: number;
}

/** Tools print odd values now and then (NaN, 100.4); only a whole 0–100 number is saved. */
function toSavablePercent(percent: number): number | null {
    if (Number.isFinite(percent) === false) {
        return null;
    }

    return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, Math.round(percent)));
}

/**
 * Progress is only a hint for the screen: a failed save must not throw away the work it
 * describes (a whole transcript), so it is logged and the next tick tries again.
 */
async function trySave(options: FlushLoopOptions, percent: number): Promise<SaveFailure | null> {
    try {
        await options.save(percent);
        return null;
    } catch (error) {
        return { error };
    }
}

/** The first failure of a streak is logged, then one in every 30, so an outage cannot flood the log. */
function logSaveFailure(error: unknown, consecutiveFailures: number): void {
    if (consecutiveFailures === 1 || consecutiveFailures % LOG_EVERY_CONSECUTIVE_FAILURES === 0) {
        logger.warn({ error, consecutiveFailures }, "Could not save the stage progress");
    }
}

/**
 * Resolves false as soon as the work finishes, so the stage does not wait out the rest of the
 * interval before it can end.
 */
async function waitForNextFlush(signal: AbortSignal): Promise<boolean> {
    try {
        await sleep(FLUSH_INTERVAL_MILLISECONDS, undefined, { signal });
        return true;
    } catch (error) {
        if (signal.aborted === true) {
            return false;
        }

        throw error;
    }
}

async function flushLatestPercent(
    options: FlushLoopOptions,
    state: FlushState,
): Promise<FlushState> {
    const latestPercent = options.readLatestPercent();

    if (latestPercent === null || latestPercent === state.savedPercent) {
        return state;
    }

    const saveFailure = await trySave(options, latestPercent);

    if (saveFailure !== null) {
        const consecutiveFailures = state.consecutiveFailures + 1;
        logSaveFailure(saveFailure.error, consecutiveFailures);
        return { savedPercent: state.savedPercent, consecutiveFailures };
    }

    return { savedPercent: latestPercent, consecutiveFailures: 0 };
}

/** Saves the latest percent once per interval until aborted, then saves the final value once. */
async function flushUntilAborted(options: FlushLoopOptions): Promise<void> {
    let state: FlushState = { savedPercent: null, consecutiveFailures: 0 };

    while ((await waitForNextFlush(options.signal)) === true) {
        state = await flushLatestPercent(options, state);
    }

    await flushLatestPercent(options, state);
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
    const flushing = flushUntilAborted({
        readLatestPercent: () => latestPercent,
        save,
        signal: workFinished.signal,
    });
    const report = (percent: number): void => {
        latestPercent = toSavablePercent(percent) ?? latestPercent;
    };

    try {
        return await work(report);
    } finally {
        workFinished.abort();
        await flushing;
    }
}
