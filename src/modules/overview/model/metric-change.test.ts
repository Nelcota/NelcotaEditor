import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { describeChange } from "#/modules/overview/model/metric-change";
import type { MetricView } from "#/modules/overview/model/overview-views";

function metric(current: number | null, previous: number | null): MetricView {
    return { current, previous, daily: [] };
}

type ChangeOptions = Parameters<typeof describeChange>[1];

const MORE_IS_BETTER: ChangeOptions = { betterWhen: "up", isAbsolute: false };
const COUNT: ChangeOptions = { betterWhen: "up", isAbsolute: true };
const LESS_IS_BETTER: ChangeOptions = { betterWhen: "down", isAbsolute: false };

describe("describeChange", () => {
    it("returns null with no current value or an empty period", () => {
        assert.equal(describeChange(metric(null, 5), MORE_IS_BETTER), null);
        assert.equal(describeChange(metric(0, 0), MORE_IS_BETTER), null);
        assert.equal(describeChange(metric(0, null), MORE_IS_BETTER), null);
    });

    it("says unchanged when the value is the same", () => {
        assert.deepEqual(describeChange(metric(4, 4), MORE_IS_BETTER), {
            label: "igual",
            direction: "none",
            tone: "neutral",
        });
    });

    it("shows the percentage and colours it by what is better", () => {
        assert.deepEqual(describeChange(metric(15, 10), MORE_IS_BETTER), {
            label: "50%",
            direction: "up",
            tone: "good",
        });
        assert.deepEqual(describeChange(metric(15, 10), LESS_IS_BETTER), {
            label: "50%",
            direction: "up",
            tone: "bad",
        });
    });

    it("shows small counts as a signed difference", () => {
        assert.equal(describeChange(metric(3, 5), COUNT)?.label, "-2");
        assert.equal(describeChange(metric(5, 3), COUNT)?.label, "+2");
    });

    it("says new when there is nothing before to divide by", () => {
        assert.deepEqual(describeChange(metric(3, 0), MORE_IS_BETTER), {
            label: "novo",
            direction: "none",
            tone: "neutral",
        });
        assert.equal(describeChange(metric(3, null), MORE_IS_BETTER)?.label, "novo");
    });
});
