import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { isFailureWorthLogging } from "#/modules/processing/server/failure-log-throttle";

describe("isFailureWorthLogging", () => {
    it("logs the first failure and then one in every 30", () => {
        const logged = Array.from({ length: 90 }, (_, index) => index + 1).filter((count) =>
            isFailureWorthLogging(count),
        );

        assert.deepEqual(logged, [1, 30, 60, 90]);
    });

    it("rejects a count that is not a positive integer", () => {
        for (const count of [0, -1, 1.5, Number.NaN]) {
            assert.throws(() => isFailureWorthLogging(count), RangeError, String(count));
        }
    });
});
