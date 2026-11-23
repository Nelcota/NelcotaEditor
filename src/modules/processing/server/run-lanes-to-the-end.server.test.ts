import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { runLanesToTheEnd } from "#/modules/processing/server/run-lanes-to-the-end.server";

class TaskFailedError extends Error {
    constructor(item: number) {
        super(`Task failed for item ${item}`);
        this.name = "TaskFailedError";
    }
}

const FAILING_ITEM = 1;
const SLOW_ITEM = 2;

describe("runLanesToTheEnd", () => {
    it("waits for the task still running before rejecting with the first failure", async () => {
        const events: Array<string> = [];

        const run = runLanesToTheEnd([FAILING_ITEM, SLOW_ITEM], 2, async (item) => {
            if (item === FAILING_ITEM) {
                throw new TaskFailedError(item);
            }

            await delay(30);
            events.push("slow task finished");
            return item;
        });
        await assert.rejects(run, TaskFailedError);
        events.push("run rejected");

        assert.deepEqual(events, ["slow task finished", "run rejected"]);
    });

    it("starts no new item after a failure", async () => {
        const started: Array<number> = [];

        const run = runLanesToTheEnd([1, 2, 3, 4], 1, async (item) => {
            started.push(item);

            if (item === 2) {
                throw new TaskFailedError(item);
            }

            return item;
        });

        await assert.rejects(run, TaskFailedError);
        assert.deepEqual(started, [1, 2]);
    });

    it("returns every result in order when nothing fails", async () => {
        const results = await runLanesToTheEnd([30, 5, 20], 2, async (milliseconds) => {
            await delay(milliseconds);
            return milliseconds;
        });

        assert.deepEqual(results, [30, 5, 20]);
    });

    it("rejects a limit that is not a positive integer", async () => {
        await assert.rejects(
            runLanesToTheEnd([1], 0, async (item) => item),
            RangeError,
        );
    });
});
