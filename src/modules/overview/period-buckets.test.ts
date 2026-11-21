import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    bucketByDay,
    createPeriodWindow,
    findDayIndex,
    InvalidPeriodError,
    listCurrentDays,
} from "#/modules/overview/period-buckets";

const WEEK = 7;

describe("createPeriodWindow", () => {
    it("starts 2 x period - 1 days before today, at São Paulo midnight", () => {
        const window = createPeriodWindow(WEEK, new Date("2026-11-21T23:59:00-03:00"));

        assert.equal(window.previousStart.toISOString(), "2026-11-08T03:00:00.000Z");
    });

    it("throws for a period that is not a positive integer", () => {
        const now = new Date("2026-11-21T12:00:00Z");

        for (const periodDays of [0, -7, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
            assert.throws(() => createPeriodWindow(periodDays, now), InvalidPeriodError);
        }
    });
});

describe("listCurrentDays", () => {
    it("ends at the São Paulo day at 23:59, although UTC is a day ahead", () => {
        const window = createPeriodWindow(WEEK, new Date("2026-11-21T23:59:00-03:00"));

        assert.deepEqual(listCurrentDays(window), [
            "2026-11-15",
            "2026-11-16",
            "2026-11-17",
            "2026-11-18",
            "2026-11-19",
            "2026-11-20",
            "2026-11-21",
        ]);
    });

    it("ends at the new day from 00:00 in São Paulo", () => {
        const window = createPeriodWindow(WEEK, new Date("2026-11-22T00:00:00-03:00"));

        assert.equal(listCurrentDays(window).at(-1), "2026-11-22");
    });

    it("crosses the month boundary", () => {
        const window = createPeriodWindow(WEEK, new Date("2026-12-02T12:00:00-03:00"));

        assert.deepEqual(listCurrentDays(window), [
            "2026-11-26",
            "2026-11-27",
            "2026-11-28",
            "2026-11-29",
            "2026-11-30",
            "2026-12-01",
            "2026-12-02",
        ]);
    });
});

describe("findDayIndex", () => {
    const window = createPeriodWindow(WEEK, new Date("2026-11-21T12:00:00-03:00"));

    it("counts days in São Paulo time, from the window start", () => {
        assert.equal(findDayIndex(window, new Date("2026-11-08T00:00:00-03:00")), 0);
        assert.equal(findDayIndex(window, new Date("2026-11-08T23:59:59-03:00")), 0);
        assert.equal(findDayIndex(window, new Date("2026-11-09T00:00:00-03:00")), 1);
        assert.equal(findDayIndex(window, new Date("2026-11-21T23:59:59-03:00")), 13);
    });

    it("returns null just outside the window", () => {
        assert.equal(findDayIndex(window, new Date("2026-11-07T23:59:59-03:00")), null);
        assert.equal(findDayIndex(window, new Date("2026-11-22T00:00:00-03:00")), null);
    });
});

describe("bucketByDay", () => {
    const window = createPeriodWindow(WEEK, new Date("2026-11-21T12:00:00-03:00"));

    it("groups values by day and skips null, undated and out-of-window items", () => {
        const items = [
            { date: new Date("2026-11-08T10:00:00-03:00"), value: 1 },
            { date: new Date("2026-11-08T22:00:00-03:00"), value: 2 },
            { date: new Date("2026-11-21T23:59:00-03:00"), value: 3 },
            { date: null, value: 4 },
            { date: new Date("2026-11-22T00:00:00-03:00"), value: 5 },
        ];
        const buckets = bucketByDay(window, [...items, undefined], (item) => {
            if (item === undefined) {
                return null;
            }

            return item;
        });

        assert.equal(buckets.length, WEEK * 2);
        assert.deepEqual(buckets[0], [1, 2]);
        assert.deepEqual(buckets[13], [3]);
        assert.equal(buckets.flat().length, 3);
    });

    it("returns empty buckets for no items", () => {
        const buckets = bucketByDay(window, [], () => null);

        assert.equal(buckets.length, WEEK * 2);
        assert.equal(buckets.flat().length, 0);
    });
});
