import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    startOfBusinessDay,
    startOfBusinessMonth,
    toBusinessDayKey,
} from "#/shared/server/business-time-zone";

// São Paulo is UTC-3 all year (no daylight saving since 2019).
const LAST_MINUTE_OF_NOV_21 = new Date("2026-11-21T23:59:00-03:00");
const MIDNIGHT_OF_NOV_22 = new Date("2026-11-22T00:00:00-03:00");

describe("toBusinessDayKey", () => {
    it("keeps 23:59 in São Paulo on the same day although UTC is already the next one", () => {
        assert.equal(LAST_MINUTE_OF_NOV_21.toISOString(), "2026-11-22T02:59:00.000Z");
        assert.equal(toBusinessDayKey(LAST_MINUTE_OF_NOV_21), "2026-11-21");
    });

    it("moves to the next day at 00:00 in São Paulo", () => {
        assert.equal(toBusinessDayKey(MIDNIGHT_OF_NOV_22), "2026-11-22");
    });

    it("rolls over months and years in the business zone", () => {
        assert.equal(toBusinessDayKey(new Date("2026-12-01T02:59:59Z")), "2026-11-30");
        assert.equal(toBusinessDayKey(new Date("2027-01-01T02:59:59Z")), "2026-12-31");
        assert.equal(toBusinessDayKey(new Date("2027-01-01T03:00:00Z")), "2027-01-01");
    });
});

describe("startOfBusinessDay", () => {
    it("returns São Paulo midnight for 23:59 and 00:00", () => {
        assert.equal(
            startOfBusinessDay(LAST_MINUTE_OF_NOV_21).toISOString(),
            "2026-11-21T03:00:00.000Z",
        );
        assert.equal(
            startOfBusinessDay(MIDNIGHT_OF_NOV_22).toISOString(),
            "2026-11-22T03:00:00.000Z",
        );
    });

    it("ignores milliseconds", () => {
        const date = new Date("2026-11-21T15:30:45.999Z");

        assert.equal(startOfBusinessDay(date).toISOString(), "2026-11-21T03:00:00.000Z");
    });
});

describe("startOfBusinessMonth", () => {
    it("keeps the last evening of the month in that month", () => {
        const lastEvening = new Date("2026-11-30T23:30:00-03:00");

        assert.equal(startOfBusinessMonth(lastEvening).toISOString(), "2026-11-01T03:00:00.000Z");
    });

    it("starts the next month at São Paulo midnight", () => {
        const firstMinute = new Date("2026-12-01T00:00:00-03:00");

        assert.equal(startOfBusinessMonth(firstMinute).toISOString(), "2026-12-01T03:00:00.000Z");
    });

    it("rolls over the year", () => {
        const newYear = new Date("2027-01-01T00:00:00-03:00");

        assert.equal(startOfBusinessMonth(newYear).toISOString(), "2027-01-01T03:00:00.000Z");
    });
});
