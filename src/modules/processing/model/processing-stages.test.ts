import { describe, expect, it } from "vitest";
import { toOverallPercent } from "#/modules/processing/model/processing-stages";

describe("toOverallPercent", () => {
    it("keeps a clips video's transcription inside its share of the bar", () => {
        expect(toOverallPercent("transcribing", 100)).toBe(65);
    });

    it("lets a format video's transcription fill the bar up to done", () => {
        expect(toOverallPercent("transcribing", 100, "format")).toBe(99);
    });

    it("starts a format video's transcription right after reading the file", () => {
        expect(toOverallPercent("transcribing", 0, "format")).toBe(15);
    });

    it("rejects a percent that is not a number", () => {
        expect(() => toOverallPercent("downloading", Number.NaN, "format")).toThrow(RangeError);
    });
});
