import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "#/db/database.server";
import { appSwitches } from "#/modules/app-switches/app-switches.schema";
import { saveAppSwitch } from "#/modules/app-switches/server/app-switches.server";
import { user } from "#/modules/auth/auth.schema";
import { clips } from "#/modules/clips/clips.schema";
import { serveSharedClip } from "#/modules/clips/server/serve-shared-clip.server";
import { videos } from "#/modules/video-records/video-records.schema";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";

// Runs against the test database from .env.test: bun run test:integration

const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const SHARE_TOKEN_BYTES = 24;

/** A rendered clip with a public link and a file on the test storage; returns the link's token. */
async function insertSharedClip(): Promise<string> {
    const userId = randomUUID();
    const videoId = randomUUID();
    const outputPath = `videos/${videoId}/clips/shared.mp4`;
    const shareToken = randomBytes(SHARE_TOKEN_BYTES).toString("base64url");
    await db.insert(user).values({
        id: userId,
        name: "Test account",
        email: `${userId}@example.com`,
        emailVerified: false,
    });
    await db.insert(videos).values({
        id: videoId,
        userId,
        title: "Test video",
        source: "upload",
        requestedClipCount: 1,
        status: "done",
    });
    await db.insert(clips).values({
        videoId,
        position: 0,
        title: "Test clip",
        reason: "Test reason",
        startSeconds: 0,
        endSeconds: 30,
        score: 80,
        status: "done",
        outputPath,
        shareToken,
    });
    await getFileStorage().storeStream(outputPath, new Blob(["clip"]).stream());

    return shareToken;
}

function requestSharedClip(shareToken: string): Promise<Response> {
    const request = new Request(`http://localhost/api/share/${shareToken}`);

    return serveSharedClip(request, shareToken);
}

describe("serveSharedClip", () => {
    beforeEach(async () => {
        await db.delete(appSwitches);
    });

    afterAll(async () => {
        await db.delete(appSwitches);
        await db.$client.end();
    });

    it("serves a shared clip while sharing is on", async () => {
        const shareToken = await insertSharedClip();

        const response = await requestSharedClip(shareToken);

        expect(response.status).toBe(HTTP_OK);
    });

    it("stops links already sent while sharing is paused", async () => {
        const shareToken = await insertSharedClip();
        await saveAppSwitch({ key: "clip-sharing", isEnabled: false, adminId: randomUUID() });

        const response = await requestSharedClip(shareToken);

        expect(response.status).toBe(HTTP_NOT_FOUND);
    });
});
