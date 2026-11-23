import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RenderDraftResult } from "#/modules/studio/clip-studio-view";
import { requeueThenRemoveOldOutput } from "#/modules/studio/server/remove-old-output-after-requeue";

class CommitFailedError extends Error {
    constructor() {
        super("Commit failed");
        this.name = "CommitFailedError";
    }
}

describe("requeueThenRemoveOldOutput", () => {
    it("keeps the old file when the requeue fails to commit", async () => {
        const steps: Array<string> = [];
        const requeue = async (): Promise<RenderDraftResult> => {
            steps.push("requeue");
            throw new CommitFailedError();
        };

        const run = requeueThenRemoveOldOutput(requeue, async () => {
            steps.push("remove");
        });

        await assert.rejects(run, CommitFailedError);
        assert.deepEqual(steps, ["requeue"]);
    });

    it("keeps the old file when another tab changed the draft first", async () => {
        let removals = 0;

        const result = await requeueThenRemoveOldOutput(
            async () => ({ kind: "conflict" }),
            async () => {
                removals += 1;
            },
        );

        assert.deepEqual(result, { kind: "conflict" });
        assert.equal(removals, 0);
    });

    it("removes the old file after the requeue committed", async () => {
        const steps: Array<string> = [];

        const result = await requeueThenRemoveOldOutput(
            async () => {
                steps.push("requeue");
                return { kind: "queued" };
            },
            async () => {
                steps.push("remove");
            },
        );

        assert.deepEqual(result, { kind: "queued" });
        assert.deepEqual(steps, ["requeue", "remove"]);
    });
});
