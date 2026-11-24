import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterAll, describe, test } from "vitest";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import {
    MAX_VIDEOS_IN_PROGRESS,
    TooManyVideosInProgressError,
} from "#/modules/videos/server/processing-limit.server";
import { reserveUploadSpace } from "#/modules/videos/server/reserve-upload-space.server";
import { StorageQuotaExceededError } from "#/modules/videos/model/storage-quota-exceeded-error";
import { getStorageQuotaBytes } from "#/modules/videos/server/usage-summary.server";

// Runs against the test database from .env.test: bun run test:integration

const SMALL_UPLOAD_BYTES = 1024;
const OVER_HALF_RATIO = 0.6;

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

/** More than half the quota, so two of them never fit together. */
function overHalfTheQuota(): number {
    return Math.floor(getStorageQuotaBytes() * OVER_HALF_RATIO);
}

describe("reserveUploadSpace", () => {
    afterAll(async () => {
        await db.$client.end();
    });

    test("refuses a parallel upload that does not fit next to one still writing", async () => {
        const userId = await createTestUser();
        const declaredBytes = overHalfTheQuota();
        await reserveUploadSpace({ userId, declaredBytes });

        const secondUpload = reserveUploadSpace({ userId, declaredBytes });

        await assert.rejects(secondUpload, StorageQuotaExceededError);
    });

    test("refuses more parallel uploads than processing slots", async () => {
        const userId = await createTestUser();

        for (let upload = 0; upload < MAX_VIDEOS_IN_PROGRESS; upload += 1) {
            await reserveUploadSpace({ userId, declaredBytes: SMALL_UPLOAD_BYTES });
        }

        const extraUpload = reserveUploadSpace({ userId, declaredBytes: SMALL_UPLOAD_BYTES });

        await assert.rejects(extraUpload, TooManyVideosInProgressError);
    });

    test("frees the space when an upload is released", async () => {
        const userId = await createTestUser();
        const declaredBytes = overHalfTheQuota();
        const release = await reserveUploadSpace({ userId, declaredBytes });

        release();

        await assert.doesNotReject(reserveUploadSpace({ userId, declaredBytes }));
    });

    test("does not count the uploads of another person", async () => {
        const userId = await createTestUser();
        const otherUserId = await createTestUser();
        const declaredBytes = overHalfTheQuota();
        await reserveUploadSpace({ userId: otherUserId, declaredBytes });

        await assert.doesNotReject(reserveUploadSpace({ userId, declaredBytes }));
    });
});
