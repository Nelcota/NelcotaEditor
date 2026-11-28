import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { formatPreciseClock, parseClockInput } from "#/modules/clips/model/clip-time";

describe("formatPreciseClock", () => {
    it("keeps the tenths", () => {
        assert.equal(formatPreciseClock(0), "0:00.0");
        assert.equal(formatPreciseClock(75.4), "1:15.4");
        assert.equal(formatPreciseClock(3725.5), "62:05.5");
    });

    it("rounds 59.96 s to 1:00.0, never 0:60.0", () => {
        assert.equal(formatPreciseClock(59.96), "1:00.0");
    });

    it("shows 0:00.0 when the tenths overflow a safe integer", () => {
        assert.equal(formatPreciseClock(1e308), "0:00.0");
    });

    it("shows 0:00.0 for NaN, infinite and negative values", () => {
        for (const value of [Number.NaN, Number.NEGATIVE_INFINITY, -0.1]) {
            assert.equal(formatPreciseClock(value), "0:00.0");
        }
    });
});

describe("parseClockInput", () => {
    it("reads seconds, minutes and hours", () => {
        assert.equal(parseClockInput("75"), 75);
        assert.equal(parseClockInput("75.5"), 75.5);
        assert.equal(parseClockInput(" 75,5 "), 75.5);
        assert.equal(parseClockInput("1:15"), 75);
        assert.equal(parseClockInput("1:02:05.5"), 3725.5);
    });

    it("round-trips what formatPreciseClock shows", () => {
        assert.equal(parseClockInput(formatPreciseClock(75.4)), 75.4);
    });

    it("rejects overflow when converting finite hours to seconds", () => {
        assert.equal(parseClockInput(`${"9".repeat(306)}:00:00`), null);
    });

    it("rejects minutes or seconds of 60 and above after the first part", () => {
        assert.equal(parseClockInput("1:75"), null);
        assert.equal(parseClockInput("1:60"), null);
        assert.equal(parseClockInput("1:59.9"), 119.9);
    });

    it("rejects anything that is not a clock", () => {
        for (const text of ["", "  ", "abc", "-5", "1:2:3:4", "1::2", "1.5.5", "1e3"]) {
            assert.equal(parseClockInput(text), null, text);
        }
    });
});
