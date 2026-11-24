import { describe, expect, it } from "vitest";
import { ADMIN_PAGE_SIZE } from "#/modules/admin/model/admin-search";
import { countAdminPages } from "#/modules/admin/model/count-admin-pages";

describe("countAdminPages", () => {
    it("keeps one page for an empty list", () => {
        expect(countAdminPages(0)).toBe(1);
    });

    it("fits a full page on one page", () => {
        expect(countAdminPages(ADMIN_PAGE_SIZE)).toBe(1);
    });

    it("opens a new page for the row after a full page", () => {
        expect(countAdminPages(ADMIN_PAGE_SIZE + 1)).toBe(2);
    });

    it("rejects a negative count", () => {
        expect(() => countAdminPages(-1)).toThrow(RangeError);
    });
});
