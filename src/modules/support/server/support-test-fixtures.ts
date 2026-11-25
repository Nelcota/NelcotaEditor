import { randomUUID } from "node:crypto";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { videos } from "#/modules/video-records/video-records.schema";

// Shared by the support integration tests only; never imported by app code.

export async function createTestAccount(name: string = "Ana Teste"): Promise<string> {
    const userId = randomUUID();
    await db.insert(user).values({
        id: userId,
        name,
        email: `support-${userId}@example.com`,
        emailVerified: true,
    });

    return userId;
}

export async function createTestVideo(userId: string): Promise<string> {
    const videoId = randomUUID();
    await db.insert(videos).values({
        id: videoId,
        userId,
        title: "Live de domingo",
        source: "upload",
        requestedClipCount: 1,
        status: "failed",
        errorMessage: "O YouTube recusou o download.",
    });

    return videoId;
}
