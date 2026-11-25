import { describe, expect, it } from "vitest";
import { toChecklistStorageKey } from "#/modules/shell/model/getting-started";

describe("toChecklistStorageKey", () => {
    it("keeps each person's checklist apart in a shared browser", () => {
        const firstKey = toChecklistStorageKey("user-a", "pro");
        const secondKey = toChecklistStorageKey("user-b", "pro");

        expect(firstKey).not.toBe(secondKey);
    });

    it("rejects an empty user id", () => {
        expect(() => toChecklistStorageKey("  ", "lesson")).toThrow(/user's id/);
    });
});
