import { describe, expect, it } from "vitest";
import { contentTypeForKey } from "#/shared/server/file-storage/content-type-for-key";

describe("contentTypeForKey", () => {
    it("reads the type from the extension, whatever its case", () => {
        expect(contentTypeForKey("videos/abc/source.MOV")).toBe("video/quicktime");
    });

    it("falls back to a generic type for an unknown extension", () => {
        expect(contentTypeForKey("videos/abc/source.flv")).toBe("application/octet-stream");
    });
});
