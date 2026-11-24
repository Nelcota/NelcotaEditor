import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterAll, describe, test } from "vitest";
import { eq } from "drizzle-orm";
import { Client } from "pg";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import {
    AccountHasWorkingVideosError,
    deleteUserAccountRecords,
} from "#/modules/video-records/server/delete-user-videos.server";
import { videos } from "#/modules/video-records/video-records.schema";
import { getEnvironment } from "#/shared/server/env.server";

// Runs against the test database from .env.test: bun run test:integration

const WAIT_FOR_LOCK_MILLISECONDS = 300;

async function createTestUser(): Promise<string> {
    const userId = randomUUID();
    await db.insert(user).values({
        id: userId,
        name: "Test account",
        email: `${userId}@example.com`,
        emailVerified: false,
    });

    return userId;
}

async function insertVideoInOpenTransaction(client: Client, userId: string): Promise<string> {
    const videoId = randomUUID();
    await client.query("begin");
    await client.query(
        "insert into videos (id, user_id, title, source, status, requested_clip_count) values ($1, $2, 'Upload', 'upload', 'done', 3)",
        [videoId, userId],
    );

    return videoId;
}

describe("deleteUserAccountRecords", () => {
    afterAll(async () => {
        await db.$client.end();
    });

    test("returns the video of an upload that finishes while the account is being deleted", async () => {
        const userId = await createTestUser();
        const uploadClient = new Client({ connectionString: getEnvironment().DATABASE_URL });
        await uploadClient.connect();
        const videoId = await insertVideoInOpenTransaction(uploadClient, userId);

        const deletion = deleteUserAccountRecords(userId);
        await new Promise((resolve) => setTimeout(resolve, WAIT_FOR_LOCK_MILLISECONDS));
        await uploadClient.query("commit");
        await uploadClient.end();
        const deletedVideoIds = await deletion;

        assert.deepEqual(deletedVideoIds, [videoId]);
    });

    test("refuses while a video is still processing and keeps the account", async () => {
        const userId = await createTestUser();
        await db.insert(videos).values({
            id: randomUUID(),
            userId,
            title: "Processing",
            source: "upload",
            status: "transcribing",
            requestedClipCount: 3,
        });

        await assert.rejects(deleteUserAccountRecords(userId), AccountHasWorkingVideosError);

        const remaining = await db.select({ id: user.id }).from(user).where(eq(user.id, userId));
        assert.equal(remaining.length, 1);
    });

    test("returns null for an account that does not exist", async () => {
        const deletedVideoIds = await deleteUserAccountRecords(randomUUID());

        assert.equal(deletedVideoIds, null);
    });
});
