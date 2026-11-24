import { setTimeout as delay } from "node:timers/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "#/shared/server/logger.server";
import { runWithProgress } from "#/shared/server/run-with-progress.server";

class SaveFailedError extends Error {
    constructor() {
        super("Could not save progress");
        this.name = "SaveFailedError";
    }
}

// Long enough for the once-per-second flush to run once, twice with the second value.
const ONE_FLUSH_MILLISECONDS = 1_300;
const TWO_FLUSHES_MILLISECONDS = 2_400;

afterEach(() => {
    vi.restoreAllMocks();
});

describe("runWithProgress", () => {
    it("keeps the finished work when a progress save fails", async () => {
        vi.spyOn(logger, "warn").mockImplementation(() => undefined);

        const result = await runWithProgress(
            async (report) => {
                report(50);
                await delay(ONE_FLUSH_MILLISECONDS);
                return "transcript";
            },
            async () => {
                throw new SaveFailedError();
            },
        );

        expect(result).toBe("transcript");
    });

    it("logs the failed save as a warning", async () => {
        const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);

        await runWithProgress(
            async (report) => {
                report(50);
                await delay(ONE_FLUSH_MILLISECONDS);
            },
            async () => {
                throw new SaveFailedError();
            },
        );

        expect(warn).toHaveBeenCalledTimes(1);
    });

    it("keeps saving on later ticks after a failed save", async () => {
        vi.spyOn(logger, "warn").mockImplementation(() => undefined);
        const saved: Array<number> = [];
        let attempts = 0;

        await runWithProgress(
            async (report) => {
                report(40);
                await delay(ONE_FLUSH_MILLISECONDS);
                report(80);
                await delay(TWO_FLUSHES_MILLISECONDS - ONE_FLUSH_MILLISECONDS);
            },
            async (percent) => {
                attempts += 1;

                if (attempts === 1) {
                    throw new SaveFailedError();
                }

                saved.push(percent);
            },
        );

        expect(saved).toContain(80);
    });

    it("still rejects with the work's own failure", async () => {
        const run = runWithProgress(
            async () => {
                throw new SaveFailedError();
            },
            async () => undefined,
        );

        await expect(run).rejects.toThrow(SaveFailedError);
    });
});
