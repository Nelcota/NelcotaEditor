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

// Long enough for the once-per-second flush to run once while the work is still going.
const ONE_FLUSH_MILLISECONDS = 1_100;
// Far below the flush interval: the stage must not wait out the rest of it.
const MAX_FINISH_MILLISECONDS = 200;

afterEach(() => {
    vi.restoreAllMocks();
});

describe("runWithProgress", () => {
    it("ends with the work, without waiting for the next flush", async () => {
        const startedAt = performance.now();

        await runWithProgress(
            async () => "transcript",
            async () => undefined,
        );

        expect(performance.now() - startedAt).toBeLessThan(MAX_FINISH_MILLISECONDS);
    });

    it("saves the last reported percent when the work ends", async () => {
        const saved: Array<number> = [];

        await runWithProgress(
            async (report) => {
                report(30);
                report(70);
            },
            async (percent) => {
                saved.push(percent);
            },
        );

        expect(saved).toEqual([70]);
    });

    it("saves the latest percent once per interval while the work runs", async () => {
        const saved: Array<number> = [];

        await runWithProgress(
            async (report) => {
                report(40);
                await delay(ONE_FLUSH_MILLISECONDS);
                report(80);
            },
            async (percent) => {
                saved.push(percent);
            },
        );

        expect(saved).toEqual([40, 80]);
    });

    it("keeps the finished work when a progress save fails", async () => {
        vi.spyOn(logger, "warn").mockImplementation(() => undefined);

        const result = await runWithProgress(
            async (report) => {
                report(50);
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
            },
            async (percent) => {
                attempts += 1;

                if (attempts === 1) {
                    throw new SaveFailedError();
                }

                saved.push(percent);
            },
        );

        expect(saved).toEqual([80]);
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
