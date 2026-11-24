import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { clipsSearchSchema, toClipsSearch } from "#/modules/videos/model/clips-search";

describe("toClipsSearch", () => {
    it("keeps the defaults out of the URL", () => {
        assert.deepEqual(toClipsSearch("  ", "newest"), {});
    });

    it("keeps a trimmed search and a non-default order", () => {
        assert.deepEqual(toClipsSearch(" receita ", "best"), { q: "receita", order: "best" });
    });
});

describe("clipsSearchSchema", () => {
    it("drops an unknown order instead of failing the page", () => {
        const search = clipsSearchSchema.parse({ q: "receita", order: "oldest" });

        assert.deepEqual(search, { q: "receita", order: undefined });
    });
});
