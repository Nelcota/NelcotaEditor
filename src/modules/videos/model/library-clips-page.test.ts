import { describe, expect, it } from "vitest";
import { libraryClipCursorSchema } from "#/modules/videos/model/library-clips-page";

describe("library clip cursors", () => {
    it("checks the score and integer column bounds before the database query", () => {
        const cursor = {
            id: "3159d1ca-c2d4-47ee-a5e2-a4c209b3b36c",
            createdAt: "2026-11-25T12:00:00.000Z",
            score: 100,
            position: 2_147_483_647,
        };

        expect(libraryClipCursorSchema.safeParse(cursor).success).toBe(true);
        expect(
            libraryClipCursorSchema.safeParse({ ...cursor, position: cursor.position + 1 }).success,
        ).toBe(false);
        expect(libraryClipCursorSchema.safeParse({ ...cursor, score: 101 }).success).toBe(false);
    });
});
