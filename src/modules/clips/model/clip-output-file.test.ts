import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildClipOutputFileName } from "#/modules/clips/model/clip-output-file";

const CLIP_ID = "6f1c2f0e-6a43-4d8e-9a39-0c2b8f0f4a11";

describe("buildClipOutputFileName", () => {
    it("gives a render of a newer draft a different file than the previous render", () => {
        const previousFile = buildClipOutputFileName(CLIP_ID, 3);

        const nextFile = buildClipOutputFileName(CLIP_ID, 4);

        assert.notEqual(nextFile, previousFile);
    });

    it("names the file after the clip and keeps the mp4 extension", () => {
        const fileName = buildClipOutputFileName(CLIP_ID, 0);

        assert.equal(fileName, `${CLIP_ID}-v0.mp4`);
    });

    it("rejects an empty clip id", () => {
        assert.throws(() => buildClipOutputFileName("  ", 1), RangeError);
    });

    it("rejects a version that is negative, fractional or not finite", () => {
        for (const version of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
            assert.throws(() => buildClipOutputFileName(CLIP_ID, version), RangeError);
        }
    });
});
