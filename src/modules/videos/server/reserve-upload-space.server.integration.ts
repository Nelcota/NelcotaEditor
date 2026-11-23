import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, test } from "node:test";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import {
    MAX_VIDEOS_IN_PROGRESS,
    TooManyVideosInProgressError,
} from "#/modules/videos/server/processing-limit.server";
import { reserveUploadSpace } from "#/modules/videos/server/reserve-upload-space.server";
import { StorageQuotaExceededError } from "#/modules/videos/server/storage-quota.server";
import { getStorageQuotaBytes } from "#/modules/videos/server/usage-summary.server";

// Needs a disposable database with the migrations applied (DATABASE_URL in .env); it is not part
// of `npm run check`. Run: npx tsx --test --test-force-exit src/modules/videos/server/reserve-upload-space.server.integration.ts

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
    after(async () => {
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
