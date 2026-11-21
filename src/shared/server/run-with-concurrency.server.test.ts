import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { runWithConcurrency } from "#/shared/server/run-with-concurrency.server";

class TaskFailedError extends Error {
    constructor(item: number) {
        super(`Task failed for item ${item}`);
        this.name = "TaskFailedError";
    }
}

async function echo(item: number): Promise<number> {
    return item;
}

describe("runWithConcurrency", () => {
    it("rejects a limit that is not a positive integer", async () => {
        for (const limit of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
            await assert.rejects(runWithConcurrency([1, 2], limit, echo), RangeError);
        }
    });

    it("returns an empty list without calling the task", async () => {
        let calls = 0;
        const results = await runWithConcurrency([], 3, async () => {
            calls += 1;
            return calls;
        });

        assert.deepEqual(results, []);
        assert.equal(calls, 0);
    });

    it("keeps the order of the items when later ones finish first", async () => {
        const delays = [30, 5, 20, 1, 10];
        const results = await runWithConcurrency(delays, 2, async (milliseconds, index) => {
            await delay(milliseconds);
            return `${index}:${milliseconds}`;
        });

        assert.deepEqual(results, ["0:30", "1:5", "2:20", "3:1", "4:10"]);
    });

    it("never runs more than the limit at once and runs every item once", async () => {
        const items = Array.from({ length: 10 }, (_, index) => index);
        const seen: Array<number> = [];
        let running = 0;
        let peak = 0;

        await runWithConcurrency(items, 3, async (item) => {
            running += 1;
            peak = Math.max(peak, running);
            await delay(2);
            seen.push(item);
            running -= 1;
        });

        assert.equal(peak, 3);
        assert.deepEqual(
            seen.toSorted((first, second) => first - second),
            items,
        );
    });

    it("works with a limit above the number of items", async () => {
        const results = await runWithConcurrency([1, 2], 10, async (item) => item * 2);

        assert.deepEqual(results, [2, 4]);
    });

    it("rejects on the first failure and starts no new items", async () => {
        const started: Array<number> = [];
        const run = runWithConcurrency([1, 2, 3, 4], 1, async (item) => {
            started.push(item);

            if (item === 2) {
                throw new TaskFailedError(item);
            }

            return item;
        });

        await assert.rejects(run, TaskFailedError);
        assert.deepEqual(started, [1, 2]);
    });
});
