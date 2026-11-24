import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { buildRenderedClipUpdate } from "#/modules/clips/model/rendered-clip-update";

const OUTPUT_PATH = "videos/abc/clips/abc-v1.mp4";

describe("buildRenderedClipUpdate", () => {
    it("marks the clip done in the same write that stores its size", () => {
        const update = buildRenderedClipUpdate(OUTPUT_PATH, 1_048_576);

        assert.deepEqual(update, {
            status: "done",
            outputPath: OUTPUT_PATH,
            outputBytes: 1_048_576,
        });
    });

    it("accepts an empty file", () => {
        const update = buildRenderedClipUpdate(OUTPUT_PATH, 0);

        assert.equal(update.outputBytes, 0);
    });

    it("rejects an empty path", () => {
        assert.throws(() => buildRenderedClipUpdate(" ", 10), RangeError);
    });

    it("rejects a size that is negative, fractional or not finite", () => {
        for (const bytes of [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
            assert.throws(() => buildRenderedClipUpdate(OUTPUT_PATH, bytes), RangeError);
        }
    });
});
