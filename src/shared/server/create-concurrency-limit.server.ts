interface ConcurrencyLimit {
    run<Result>(signal: AbortSignal, task: () => Promise<Result>): Promise<Result>;
}

export function createConcurrencyLimit(limit: number): ConcurrencyLimit {
    if (Number.isSafeInteger(limit) === false || limit < 1) {
        throw new RangeError(`Concurrency limit must be a positive integer, got ${limit}`);
    }

    const waiting = new Set<() => void>();
    let running = 0;

    function waitForSlot(signal: AbortSignal): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const onAbort = (): void => {
                waiting.delete(grant);
                reject(signal.reason);
            };
            const grant = (): void => {
                signal.removeEventListener("abort", onAbort);
                resolve();
            };

            waiting.add(grant);
            signal.addEventListener("abort", onAbort, { once: true });
        });
    }

    function releaseSlot(): void {
        const next = waiting.values().next().value;

        if (next !== undefined) {
            // Hand off the slot before another caller can take it.
            waiting.delete(next);
            next();
            return;
        }

        running -= 1;
    }

    function takeSlot(signal: AbortSignal): Promise<void> | null {
        if (running === limit) {
            return waitForSlot(signal);
        }

        running += 1;
        return null;
    }

    async function run<Result>(signal: AbortSignal, task: () => Promise<Result>): Promise<Result> {
        signal.throwIfAborted();
        const slot = takeSlot(signal);

        if (slot !== null) {
            await slot;
        }

        try {
            signal.throwIfAborted();
            return await task();
        } finally {
            releaseSlot();
        }
    }

    return { run };
}
