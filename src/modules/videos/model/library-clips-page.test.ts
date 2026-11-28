import { describe, expect, it } from "vitest";
import { libraryClipCursorSchema } from "#/modules/videos/model/library-clips-page";

const CURSOR = {
    id: "3159d1ca-c2d4-47ee-a5e2-a4c209b3b36c",
    createdAt: "2026-11-25T12:00:00.000Z",
    score: 100,
    position: 2_147_483_647,
};

describe("library clip cursors", () => {
    it("accepts the highest score and the largest integer position", () => {
        const result = libraryClipCursorSchema.safeParse(CURSOR);

        expect(result.success).toBe(true);
    });

    it("rejects a position beyond the integer column", () => {
        const result = libraryClipCursorSchema.safeParse({
            ...CURSOR,
            position: CURSOR.position + 1,
        });

        expect(result.success).toBe(false);
    });

    it("rejects a score above the highest score", () => {
        const result = libraryClipCursorSchema.safeParse({ ...CURSOR, score: 101 });

        expect(result.success).toBe(false);
    });
});
