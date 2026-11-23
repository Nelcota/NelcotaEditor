import assert from "node:assert/strict";
import { test } from "node:test";
import {
    adminOverviewQueryOptions,
    adminVideosQueryOptions,
} from "#/modules/admin/ui/admin-queries";

const ONE_MINUTE_MILLISECONDS = 60 * 1000;

test("admin overview polls once a minute and only while the tab is visible", () => {
    const options = adminOverviewQueryOptions();

    assert.equal(options.refetchInterval, ONE_MINUTE_MILLISECONDS);
    assert.equal(options.refetchIntervalInBackground, false);
});

test("admin video list polls once a minute and only while the tab is visible", () => {
    const options = adminVideosQueryOptions({ filter: "all", query: "", ownerId: null, page: 1 });

    assert.equal(options.refetchInterval, ONE_MINUTE_MILLISECONDS);
    assert.equal(options.refetchIntervalInBackground, false);
});
