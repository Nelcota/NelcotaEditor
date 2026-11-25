import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "#/db/database.server";
import { appSwitches } from "#/modules/app-switches/app-switches.schema";
import { saveAppSwitch } from "#/modules/app-switches/server/app-switches.server";
import { createVideoWorkSync } from "#/modules/processing/server/video-work-switch.server";

// Runs against the test database from .env.test: bun run test:integration

const ADMIN_ID = randomUUID();

/** Records each start and stop the sync asks for, in order. */
function createRecordedSync(): { calls: Array<string>; sync: () => Promise<void> } {
    const calls: Array<string> = [];
    const sync = createVideoWorkSync({
        startWork: async () => {
            calls.push("start");
        },
        stopWork: async () => {
            calls.push("stop");
        },
    });

    return { calls, sync };
}

describe("createVideoWorkSync", () => {
    beforeEach(async () => {
        await db.delete(appSwitches);
    });

    afterAll(async () => {
        await db.delete(appSwitches);
        await db.$client.end();
    });

    it("starts taking videos once when processing is on", async () => {
        const { calls, sync } = createRecordedSync();

        await sync();
        await sync();

        expect(calls).toEqual(["start"]);
    });

    it("takes no videos when processing starts paused", async () => {
        await saveAppSwitch({ key: "video-processing", isEnabled: false, adminId: ADMIN_ID });
        const { calls, sync } = createRecordedSync();

        await sync();

        expect(calls).toEqual([]);
    });

    it("stops taking videos when an admin pauses processing, and resumes after", async () => {
        const { calls, sync } = createRecordedSync();
        await sync();

        await saveAppSwitch({ key: "video-processing", isEnabled: false, adminId: ADMIN_ID });
        await sync();
        await saveAppSwitch({ key: "video-processing", isEnabled: true, adminId: ADMIN_ID });
        await sync();

        expect(calls).toEqual(["start", "stop", "start"]);
    });
});
