import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { measureFirstRun } from "#/modules/overview/model/first-run-duration";

describe("measureFirstRun", () => {
    it("measures from the upload to the first time the video was done, on that day", () => {
        const firstFinishedAt = new Date("2026-11-10T10:12:00-03:00");

        const measured = measureFirstRun({
            createdAt: new Date("2026-11-10T10:00:00-03:00"),
            firstFinishedAt,
        });

        assert.deepEqual(measured, { date: firstFinishedAt, value: 720 });
    });

    it("leaves out a video that was never done", () => {
        const measured = measureFirstRun({
            createdAt: new Date("2026-11-10T10:00:00-03:00"),
            firstFinishedAt: null,
        });

        assert.equal(measured, null);
    });
});
