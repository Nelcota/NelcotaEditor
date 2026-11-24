import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { InvalidFileSizeError, parseByteRange } from "#/shared/server/byte-range.server";

const FILE_SIZE = 1000;

describe("parseByteRange", () => {
    it("sends the whole file when there is no header or one it ignores", () => {
        for (const header of [null, "bytes=-", "items=0-10", "bytes=0-1,5-6", "bytes=abc", ""]) {
            assert.equal(parseByteRange(header, FILE_SIZE), undefined, String(header));
        }
    });

    it("reads a closed range and clamps its end to the last byte", () => {
        assert.deepEqual(parseByteRange("bytes=0-99", FILE_SIZE), { start: 0, end: 99 });
        assert.deepEqual(parseByteRange(" bytes=900-5000 ", FILE_SIZE), { start: 900, end: 999 });
    });

    it("reads an open range to the end of the file", () => {
        assert.deepEqual(parseByteRange("bytes=500-", FILE_SIZE), { start: 500, end: 999 });
        assert.deepEqual(parseByteRange("bytes=999-", FILE_SIZE), { start: 999, end: 999 });
    });

    it("reads a suffix range and clamps it to the file", () => {
        assert.deepEqual(parseByteRange("bytes=-100", FILE_SIZE), { start: 900, end: 999 });
        assert.deepEqual(parseByteRange("bytes=-5000", FILE_SIZE), { start: 0, end: 999 });
    });

    it("cannot satisfy a zero suffix, a start past the end or a reversed range", () => {
        assert.equal(parseByteRange("bytes=-0", FILE_SIZE), null);
        assert.equal(parseByteRange("bytes=1000-", FILE_SIZE), null);
        assert.equal(parseByteRange("bytes=5-3", FILE_SIZE), null);
    });

    it("cannot satisfy any range of an empty file", () => {
        assert.equal(parseByteRange("bytes=0-", 0), null);
        assert.equal(parseByteRange("bytes=-10", 0), null);
        assert.equal(parseByteRange(null, 0), undefined);
    });

    it("throws for a file size that is not a non-negative safe integer", () => {
        for (const fileSize of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
            assert.throws(() => parseByteRange("bytes=0-", fileSize), InvalidFileSizeError);
        }
    });
});
