import { describe, expect, it } from "vitest";
import { tickSeconds, toPercent } from "#/modules/studio/client/timeline-geometry";

describe("timeline geometry", () => {
    it("keeps valid endpoints and returns zero for an invalid or empty span", () => {
        expect(toPercent({ fromSeconds: 10, toSeconds: 20 }, 20)).toBe(100);
        expect(toPercent({ fromSeconds: 10, toSeconds: 10 }, 10)).toBe(0);
        expect(toPercent({ fromSeconds: 10, toSeconds: Number.NaN }, 10)).toBe(0);
    });

    it("omits ticks for an unbounded or out-of-range window", () => {
        expect(tickSeconds({ fromSeconds: 10, toSeconds: 20 })).toEqual([10, 15, 20]);
        expect(tickSeconds({ fromSeconds: 10, toSeconds: Number.POSITIVE_INFINITY })).toEqual([]);
        expect(tickSeconds({ fromSeconds: 10, toSeconds: Number.MAX_SAFE_INTEGER })).toEqual([]);
    });
});
