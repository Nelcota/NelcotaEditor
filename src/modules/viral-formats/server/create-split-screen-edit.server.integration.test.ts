import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { transcripts } from "#/modules/transcription/transcription.schema";
import { videos } from "#/modules/video-records/video-records.schema";
import { InvalidEditPlanError } from "#/modules/viral-formats/model/edit-errors";
import { splitScreenPlanSchema } from "#/modules/viral-formats/model/split-screen-plan";
import type { SplitScreenPlan } from "#/modules/viral-formats/model/split-screen-plan";
import { createSplitScreenEdit } from "#/modules/viral-formats/server/create-split-screen-edit.server";
import { edits } from "#/modules/viral-formats/viral-formats.schema";

// Runs against the test database from .env.test: bun run test:integration

async function createPerson(): Promise<string> {
    const userId = randomUUID();
    await db.insert(user).values({
        id: userId,
        name: "Ana Teste",
        email: `edit-${userId}@example.com`,
        emailVerified: true,
    });

    return userId;
}

/** A processed video with its file and, when asked, a transcript. */
async function createReadyVideo(userId: string, hasTranscript: boolean): Promise<string> {
    const videoId = randomUUID();
    await db.insert(videos).values({
        id: videoId,
        userId,
        title: "Bruto",
        source: "upload",
        requestedClipCount: 1,
        status: "done",
        sourcePath: `videos/${videoId}/source.mp4`,
        durationSeconds: 30,
    });

    if (hasTranscript === true) {
        await db.insert(transcripts).values({
            videoId,
            words: [{ text: "Olha", startSeconds: 1, endSeconds: 1.4 }],
        });
    }

    return videoId;
}

function buildPlan(videoId: string, exampleId: string, lastTakeEnd: number = 10): SplitScreenPlan {
    return splitScreenPlanSchema.parse({
        videoId,
        title: "Formatos virais",
        takes: [
            { start: 1, end: 5 },
            { start: 8, end: lastTakeEnd },
        ],
        panels: [
            { kind: "example", at: 0, sourceVideoId: exampleId, sourceStart: 2 },
            { kind: "fullscreen", at: 4 },
        ],
    });
}

afterAll(async () => {
    await db.$client.end();
});

describe("createSplitScreenEdit", () => {
    it("stores the plan as a queued edit of the person's", async () => {
        const userId = await createPerson();
        const videoId = await createReadyVideo(userId, true);
        const exampleId = await createReadyVideo(userId, false);

        const editId = await createSplitScreenEdit(userId, buildPlan(videoId, exampleId));

        const rows = await db.select().from(edits).where(eq(edits.id, editId));
        expect(rows[0]).toMatchObject({
            userId,
            videoId,
            status: "queued",
            format: "split-screen",
        });
    });

    it("refuses another person's example as if it did not exist", async () => {
        const userId = await createPerson();
        const strangerId = await createPerson();
        const videoId = await createReadyVideo(userId, true);
        const strangerVideoId = await createReadyVideo(strangerId, false);

        await expect(
            createSplitScreenEdit(userId, buildPlan(videoId, strangerVideoId)),
        ).rejects.toThrow(`Video ${strangerVideoId} was not found.`);
    });

    it("refuses a take that ends after the video does", async () => {
        const userId = await createPerson();
        const videoId = await createReadyVideo(userId, true);
        const exampleId = await createReadyVideo(userId, false);

        await expect(
            createSplitScreenEdit(userId, buildPlan(videoId, exampleId, 31)),
        ).rejects.toThrow(InvalidEditPlanError);
    });

    it("waits for the transcript the captions come from", async () => {
        const userId = await createPerson();
        const videoId = await createReadyVideo(userId, false);
        const exampleId = await createReadyVideo(userId, false);

        await expect(createSplitScreenEdit(userId, buildPlan(videoId, exampleId))).rejects.toThrow(
            "This video has no transcript yet.",
        );
    });
});
