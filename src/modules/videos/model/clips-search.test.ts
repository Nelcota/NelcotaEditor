import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { clipsSearchSchema, toClipsSearch } from "#/modules/videos/model/clips-search";

describe("toClipsSearch", () => {
    it("keeps the defaults out of the URL", () => {
        assert.deepEqual(toClipsSearch({ query: "  ", order: "newest", view: "grid" }), {});
    });

    it("keeps a trimmed search, a non-default order and a non-default view", () => {
        const search = toClipsSearch({ query: " receita ", order: "best", view: "table" });

        assert.deepEqual(search, { q: "receita", order: "best", view: "table" });
    });
});

describe("clipsSearchSchema", () => {
    it("drops an unknown order instead of failing the page", () => {
        const search = clipsSearchSchema.parse({ q: "receita", order: "oldest" });

        assert.deepEqual(search, { q: "receita", order: undefined });
    });

    it("drops an unknown view instead of failing the page", () => {
        const search = clipsSearchSchema.parse({ view: "list" });

        assert.deepEqual(search, { view: undefined });
    });
});
