import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { afterAll, describe, test } from "vitest";
import { db } from "#/db/database.server";
import { runWithVideoProcessingLock } from "#/modules/processing/server/video-processing-lock.server";
import {
    createVideoWorkspace,
    removeAbandonedVideoWorkspaces,
    removeVideoWorkspace,
} from "#/modules/processing/server/video-workspace.server";

// Runs against the test database from .env.test: bun run test:integration

describe("removeAbandonedVideoWorkspaces", () => {
    afterAll(async () => {
        await db.$client.end();
    });

    test("keeps the workspace of a video another worker is processing", async () => {
        const processingVideoId = randomUUID();
        const abandonedVideoId = randomUUID();
        const processingWorkspace = await createVideoWorkspace(processingVideoId);
        const abandonedWorkspace = await createVideoWorkspace(abandonedVideoId);

        await runWithVideoProcessingLock(processingVideoId, removeAbandonedVideoWorkspaces);

        assert.equal(existsSync(processingWorkspace), true);
        assert.equal(existsSync(abandonedWorkspace), false);
        await removeVideoWorkspace(processingVideoId);
    });
});
