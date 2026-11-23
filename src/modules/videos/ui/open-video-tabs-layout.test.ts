import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    TAB_MIN_WIDTH_PIXELS,
    countVisibleTabs,
    splitOpenTabs,
} from "#/modules/videos/ui/open-video-tabs-layout";

const TABS = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

function toIds(tabs: Array<{ id: string }>): Array<string> {
    return tabs.map((tab) => tab.id);
}

describe("countVisibleTabs", () => {
    it("shows every tab when they all fit at their minimum width", () => {
        const visibleCount = countVisibleTabs(1000, 3);

        assert.equal(visibleCount, 3);
    });

    it("keeps room for the more button when the tabs do not fit", () => {
        const visibleCount = countVisibleTabs(700, 7);

        assert.equal(visibleCount, 4);
    });

    it("never squeezes a tab under its minimum width", () => {
        const width = 900;

        const visibleCount = countVisibleTabs(width, 8);

        assert.ok(visibleCount * TAB_MIN_WIDTH_PIXELS < width);
        assert.ok(visibleCount < 8);
    });

    it("shows no tab when there is no room, leaving them all in the more button", () => {
        const visibleCount = countVisibleTabs(60, 3);

        assert.equal(visibleCount, 0);
    });

    it("returns zero without tabs", () => {
        const visibleCount = countVisibleTabs(0, 0);

        assert.equal(visibleCount, 0);
    });

    it("throws on a width that is not a number", () => {
        assert.throws(() => countVisibleTabs(Number.NaN, 2), RangeError);
    });

    it("throws on a negative tab count", () => {
        assert.throws(() => countVisibleTabs(500, -1), RangeError);
    });
});

describe("splitOpenTabs", () => {
    it("keeps the opening order when the tab in view is already visible", () => {
        const split = splitOpenTabs(TABS, 2, "a");

        assert.deepEqual(toIds(split.visible), ["a", "b"]);
        assert.deepEqual(toIds(split.hidden), ["c", "d"]);
    });

    it("moves the tab in view into the last visible slot", () => {
        const split = splitOpenTabs(TABS, 2, "d");

        assert.deepEqual(toIds(split.visible), ["a", "d"]);
        assert.deepEqual(toIds(split.hidden), ["b", "c"]);
    });

    it("leaves every tab hidden when none is visible", () => {
        const split = splitOpenTabs(TABS, 0, "c");

        assert.deepEqual(toIds(split.visible), []);
        assert.deepEqual(toIds(split.hidden), ["a", "b", "c", "d"]);
    });

    it("throws on a visible count that is not an integer", () => {
        assert.throws(() => splitOpenTabs(TABS, 1.5, undefined), RangeError);
    });
});
