import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    formatBytes,
    formatClock,
    formatDate,
    formatDateTime,
    formatTimeLeft,
} from "#/shared/ui/format";

const NO_BREAK_SPACE = String.fromCodePoint(0xa0);

/** Lets the expectations be written with plain spaces. */
function withPlainSpaces(text: string): string {
    return text.replaceAll(NO_BREAK_SPACE, " ");
}

describe("formatClock", () => {
    it("formats minutes and hours", () => {
        assert.equal(formatClock(0), "0:00");
        assert.equal(formatClock(75), "1:15");
        assert.equal(formatClock(3725), "1:02:05");
    });

    it("rounds 59.6 s up to the next minute instead of 0:60", () => {
        assert.equal(formatClock(59.6), "1:00");
        assert.equal(formatClock(3599.5), "1:00:00");
    });

    it("shows 0:00 for NaN, infinite and negative values", () => {
        for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
            assert.equal(formatClock(value), "0:00");
        }
    });
});

describe("formatTimeLeft", () => {
    it("says less than a minute below 60 s and for invalid values", () => {
        for (const value of [0, 40, 59.9, Number.NaN, -5]) {
            assert.equal(withPlainSpaces(formatTimeLeft(value)), "menos de 1 min");
        }
    });

    it("rounds up to whole minutes and shows hours", () => {
        assert.equal(withPlainSpaces(formatTimeLeft(60)), "cerca de 1 min");
        assert.equal(withPlainSpaces(formatTimeLeft(200)), "cerca de 4 min");
        assert.equal(withPlainSpaces(formatTimeLeft(4000)), "cerca de 1 h 7 min");
    });

    it("keeps the number and its unit on the same line", () => {
        assert.ok(formatTimeLeft(200).includes(`4${NO_BREAK_SPACE}min`));
    });
});

describe("formatBytes", () => {
    it("shows whole bytes without decimals", () => {
        assert.equal(withPlainSpaces(formatBytes(512)), "512 B");
    });

    it("shows larger units with one decimal in Brazilian format", () => {
        assert.equal(withPlainSpaces(formatBytes(1536)), "1,5 KB");
        assert.equal(withPlainSpaces(formatBytes(5 * 1024 ** 3)), "5,0 GB");
    });

    it("stays in TB beyond the largest unit", () => {
        assert.equal(withPlainSpaces(formatBytes(1024 ** 5)), "1.024,0 TB");
    });

    it("shows 0 B for zero, negative and invalid values", () => {
        for (const value of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
            assert.equal(withPlainSpaces(formatBytes(value)), "0 B");
        }
    });
});

describe("formatDate", () => {
    it("uses the São Paulo day, not the UTC one", () => {
        assert.equal(formatDate("2026-11-22T02:30:00Z"), "21/11/2026");
        assert.equal(formatDate("2026-11-22T03:00:00Z"), "22/11/2026");
    });

    it("returns an empty text for an invalid date", () => {
        assert.equal(formatDate("not a date"), "");
        assert.equal(formatDateTime(""), "");
    });

    it("formats date and time in São Paulo", () => {
        assert.match(formatDateTime("2026-11-22T02:30:00Z"), /21.*23:30/);
    });
});
