import { EventEmitter, once } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { createConcurrencyLimit } from "#/shared/server/create-concurrency-limit.server";

describe("createConcurrencyLimit", () => {
    it("shares slots and gives the released slot to the next waiting task", async () => {
        const slots = createConcurrencyLimit(2);
        const signal = new AbortController().signal;
        const finish = new EventEmitter();
        const task = vi.fn(async (name: string): Promise<void> => {
            await once(finish, name);
        });

        const first = slots.run(signal, () => task("first"));
        const second = slots.run(signal, () => task("second"));
        const third = slots.run(signal, () => task("third"));
        expect(task.mock.calls).toEqual([["first"], ["second"]]);

        finish.emit("first");
        await first;
        expect(task.mock.calls).toEqual([["first"], ["second"], ["third"]]);

        finish.emit("second");
        finish.emit("third");
        await Promise.all([second, third]);
    });

    it("removes cancelled waiters and releases a slot after a failed task", async () => {
        const slots = createConcurrencyLimit(1);
        const signal = new AbortController().signal;
        const waiting = new AbortController();
        const finish = new EventEmitter();
        const cancelledTask = vi.fn((): Promise<void> => Promise.resolve());
        const failure = new Error("Task failed");
        const cancellation = new Error("Task cancelled");
        const first = slots.run(signal, async () => {
            await once(finish, "first");
            throw failure;
        });
        const cancelled = slots.run(waiting.signal, cancelledTask);
        const next = slots.run(signal, (): Promise<string> => Promise.resolve("next"));

        waiting.abort(cancellation);
        await expect(cancelled).rejects.toBe(cancellation);
        expect(cancelledTask).not.toHaveBeenCalled();

        finish.emit("first");
        await expect(first).rejects.toBe(failure);
        await expect(next).resolves.toBe("next");
    });
});
