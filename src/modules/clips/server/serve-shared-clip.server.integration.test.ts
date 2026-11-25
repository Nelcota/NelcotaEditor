import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "#/db/database.server";
import { appSwitches } from "#/modules/app-switches/app-switches.schema";
import { saveAppSwitch } from "#/modules/app-switches/server/app-switches.server";
import { user } from "#/modules/auth/auth.schema";
import { clips } from "#/modules/clips/clips.schema";
import {
    serveSharedClip,
    serveSharedClipPoster,
} from "#/modules/clips/server/serve-shared-clip.server";
import { videos } from "#/modules/video-records/video-records.schema";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";

// Runs against the test database from .env.test: bun run test:integration

const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const SHARE_TOKEN_BYTES = 24;

/**
 * A rendered clip with a public link and its files on the test storage; returns the link's token.
 * Without a poster it stands for a clip rendered before posters existed.
 */
async function insertSharedClip({ hasPoster }: { hasPoster: boolean }): Promise<string> {
    const userId = randomUUID();
    const videoId = randomUUID();
    const outputPath = `videos/${videoId}/clips/shared.mp4`;
    const posterPath = `videos/${videoId}/clips/shared.jpg`;
    let storedPosterPath: string | null = null;

    if (hasPoster === true) {
        storedPosterPath = posterPath;
    }

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
        posterPath: storedPosterPath,
        shareToken,
    });
    await getFileStorage().storeStream(outputPath, new Blob(["clip"]).stream());
    await getFileStorage().storeStream(posterPath, new Blob(["poster"]).stream());

    return shareToken;
}

function requestSharedClip(shareToken: string): Promise<Response> {
    const request = new Request(`http://localhost/api/share/${shareToken}`);

    return serveSharedClip(request, shareToken);
}

beforeEach(async () => {
    await db.delete(appSwitches);
});

afterAll(async () => {
    await db.delete(appSwitches);
    await db.$client.end();
});

describe("serveSharedClip", () => {
    it("serves a shared clip while sharing is on", async () => {
        const shareToken = await insertSharedClip({ hasPoster: true });

        const response = await requestSharedClip(shareToken);

        expect(response.status).toBe(HTTP_OK);
    });

    it("stops links already sent while sharing is paused", async () => {
        const shareToken = await insertSharedClip({ hasPoster: true });
        await saveAppSwitch({ key: "clip-sharing", isEnabled: false, adminId: randomUUID() });

        const response = await requestSharedClip(shareToken);

        expect(response.status).toBe(HTTP_NOT_FOUND);
    });
});

describe("serveSharedClipPoster", () => {
    it("serves the poster of a shared clip", async () => {
        const shareToken = await insertSharedClip({ hasPoster: true });
        const request = new Request(`http://localhost/api/share/${shareToken}/poster`);

        const response = await serveSharedClipPoster(request, shareToken);

        expect(response.status).toBe(HTTP_OK);
        expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    });

    it("answers 404 for a clip rendered before posters existed", async () => {
        const shareToken = await insertSharedClip({ hasPoster: false });
        const request = new Request(`http://localhost/api/share/${shareToken}/poster`);

        const response = await serveSharedClipPoster(request, shareToken);

        expect(response.status).toBe(HTTP_NOT_FOUND);
    });

    it("answers 404 while sharing is paused", async () => {
        const shareToken = await insertSharedClip({ hasPoster: true });
        await saveAppSwitch({ key: "clip-sharing", isEnabled: false, adminId: randomUUID() });
        const request = new Request(`http://localhost/api/share/${shareToken}/poster`);

        const response = await serveSharedClipPoster(request, shareToken);

        expect(response.status).toBe(HTTP_NOT_FOUND);
    });
});
