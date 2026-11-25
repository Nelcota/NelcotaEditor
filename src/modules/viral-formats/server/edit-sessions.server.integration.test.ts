import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { transcripts } from "#/modules/transcription/transcription.schema";
import type { VideoPurpose } from "#/modules/video-records/model/video-status";
import { videos } from "#/modules/video-records/video-records.schema";
import { InvalidEditPlanError } from "#/modules/viral-formats/model/edit-errors";
import { splitScreenPlanSchema } from "#/modules/viral-formats/model/split-screen-plan";
import type { SplitScreenPlan } from "#/modules/viral-formats/model/split-screen-plan";
import { createSplitScreenEdit } from "#/modules/viral-formats/server/create-split-screen-edit.server";
import {
    EditSessionEmptyError,
    EditSessionLockedError,
    EditSessionVideoUnusableError,
    addSessionNote,
    addSessionVideo,
    createEditSession,
    queueEditSession,
} from "#/modules/viral-formats/server/edit-session-commands.server";
import {
    findUserEditSession,
    listQueuedEditSessions,
} from "#/modules/viral-formats/server/edit-session-queries.server";
import { edits } from "#/modules/viral-formats/viral-formats.schema";

// Runs against the test database from .env.test: bun run test:integration

const CLIP_COUNTS: Record<VideoPurpose, number> = { clips: 1, format: 0 };

async function createPerson(): Promise<string> {
    const userId = randomUUID();
    await db.insert(user).values({
        id: userId,
        name: "Ana Teste",
        email: `session-${userId}@example.com`,
        emailVerified: true,
    });

    return userId;
}

async function createVideo(userId: string, purpose: VideoPurpose): Promise<string> {
    const videoId = randomUUID();
    await db.insert(videos).values({
        id: videoId,
        userId,
        title: "Bruto",
        source: "upload",
        purpose,
        requestedClipCount: CLIP_COUNTS[purpose],
        status: "done",
        sourcePath: `videos/${videoId}/source.mp4`,
        durationSeconds: 30,
    });
    await db.insert(transcripts).values({
        videoId,
        words: [{ text: "Olha", startSeconds: 1, endSeconds: 1.4 }],
    });

    return videoId;
}

function planFor(videoId: string, sessionId: string): SplitScreenPlan {
    return splitScreenPlanSchema.parse({
        videoId,
        sessionId,
        title: "Da fila",
        takes: [{ start: 1, end: 6 }],
        panels: [{ kind: "fullscreen", at: 0 }],
    });
}

afterAll(async () => {
    await db.$client.end();
});

describe("edit sessions", () => {
    it("numbers each person's batches in a format from 1", async () => {
        const userId = await createPerson();

        const first = await createEditSession(userId, "split-screen");
        const second = await createEditSession(userId, "split-screen");

        expect((await findUserEditSession(userId, first))?.title).toBe("Tela dividida #1");
        expect((await findUserEditSession(userId, second))?.title).toBe("Tela dividida #2");
    });

    it("refuses a clips video and another person's video", async () => {
        const userId = await createPerson();
        const strangerId = await createPerson();
        const sessionId = await createEditSession(userId, "split-screen");
        const clipsVideo = await createVideo(userId, "clips");
        const strangerVideo = await createVideo(strangerId, "format");

        await expect(addSessionVideo(userId, { sessionId, videoId: clipsVideo })).rejects.toThrow(
            EditSessionVideoUnusableError,
        );
        await expect(
            addSessionVideo(userId, { sessionId, videoId: strangerVideo }),
        ).rejects.toThrow(EditSessionVideoUnusableError);
    });

    it("hides another person's batch", async () => {
        const userId = await createPerson();
        const strangerId = await createPerson();
        const sessionId = await createEditSession(userId, "split-screen");

        expect(await findUserEditSession(strangerId, sessionId)).toBeNull();
    });

    it("needs a video before it goes to Claude, then takes no more changes", async () => {
        const userId = await createPerson();
        const sessionId = await createEditSession(userId, "split-screen");

        await expect(queueEditSession(userId, sessionId)).rejects.toThrow(EditSessionEmptyError);

        await addSessionVideo(userId, {
            sessionId,
            videoId: await createVideo(userId, "format"),
        });
        await queueEditSession(userId, sessionId);

        await expect(
            addSessionNote(userId, { sessionId, body: "Legenda amarela" }),
        ).rejects.toThrow(EditSessionLockedError);
    });

    it("hands Claude the queued batch with its adjustments", async () => {
        const userId = await createPerson();
        const sessionId = await createEditSession(userId, "split-screen");
        const videoId = await createVideo(userId, "format");
        await addSessionVideo(userId, { sessionId, videoId });
        await addSessionNote(userId, { sessionId, body: "Legenda amarela" });
        await queueEditSession(userId, sessionId);

        const queue = await listQueuedEditSessions(userId);

        expect(queue).toEqual([
            expect.objectContaining({
                sessionId,
                adjustments: ["Legenda amarela"],
                videos: [expect.objectContaining({ videoId, isTranscribed: true, hasEdit: false })],
            }),
        ]);
    });

    it("links Claude's edit to the queued batch it came from", async () => {
        const userId = await createPerson();
        const sessionId = await createEditSession(userId, "split-screen");
        const videoId = await createVideo(userId, "format");
        await addSessionVideo(userId, { sessionId, videoId });
        await queueEditSession(userId, sessionId);

        const editId = await createSplitScreenEdit(userId, planFor(videoId, sessionId));

        const [edit] = await db.select().from(edits).where(eq(edits.id, editId));
        expect(edit?.sessionId).toBe(sessionId);
    });

    it("refuses an edit for a batch that was not sent yet", async () => {
        const userId = await createPerson();
        const sessionId = await createEditSession(userId, "split-screen");
        const videoId = await createVideo(userId, "format");
        await addSessionVideo(userId, { sessionId, videoId });

        await expect(createSplitScreenEdit(userId, planFor(videoId, sessionId))).rejects.toThrow(
            InvalidEditPlanError,
        );
    });
});
