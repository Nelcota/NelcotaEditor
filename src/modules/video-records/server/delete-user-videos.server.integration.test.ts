import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterAll, describe, test } from "vitest";
import { eq } from "drizzle-orm";
import { Client } from "pg";
import { db } from "#/db/database.server";
import { ADMIN_ROLE, USER_ROLE, user } from "#/modules/auth/auth.schema";
import { LastAdminError } from "#/modules/auth/model/last-admin-error";
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

async function createOnlyAdmins(count: number): Promise<Array<string>> {
    // The rule counts every admin in the database; the admins of other test files would hide it.
    await db.update(user).set({ role: USER_ROLE }).where(eq(user.role, ADMIN_ROLE));
    const adminIds: Array<string> = [];

    for (let index = 0; index < count; index += 1) {
        const adminId = await createTestUser();
        await db.update(user).set({ role: ADMIN_ROLE }).where(eq(user.id, adminId));
        adminIds.push(adminId);
    }

    return adminIds;
}

async function countAdmins(): Promise<number> {
    const admins = await db.select({ id: user.id }).from(user).where(eq(user.role, ADMIN_ROLE));

    return admins.length;
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

    test("refuses to delete the last admin and keeps the account", async () => {
        const [lastAdminId] = await createOnlyAdmins(1);
        assert.ok(lastAdminId !== undefined);

        await assert.rejects(deleteUserAccountRecords(lastAdminId), LastAdminError);

        assert.equal(await countAdmins(), 1);
    });

    test("keeps one admin when the last two delete their accounts at the same time", async () => {
        const adminIds = await createOnlyAdmins(2);

        const results = await Promise.allSettled(
            adminIds.map((adminId) => deleteUserAccountRecords(adminId)),
        );

        assert.equal(results.filter((result) => result.status === "rejected").length, 1);
        assert.equal(await countAdmins(), 1);
    });
});
