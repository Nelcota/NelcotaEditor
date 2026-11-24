import assert from "node:assert/strict";
import { test } from "node:test";
import { ADMIN_POLLING_OPTIONS } from "#/modules/admin/model/admin-polling";

const ONE_MINUTE_MILLISECONDS = 60 * 1000;

test("admin data polls once a minute and only while the tab is visible", () => {
    assert.equal(ADMIN_POLLING_OPTIONS.refetchInterval, ONE_MINUTE_MILLISECONDS);
    assert.equal(ADMIN_POLLING_OPTIONS.refetchIntervalInBackground, false);
});
