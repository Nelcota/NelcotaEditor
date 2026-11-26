import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { transcripts } from "#/modules/transcription/transcription.schema";
import type { VideoPurpose } from "#/modules/video-records/model/video-status";
import { videos } from "#/modules/video-records/video-records.schema";
import { contrastPlanSchema } from "#/modules/viral-formats/model/contrast-plan";
import { InvalidEditPlanError } from "#/modules/viral-formats/model/edit-errors";
import { splitScreenPlanSchema } from "#/modules/viral-formats/model/split-screen-plan";
import type { SplitScreenPlan } from "#/modules/viral-formats/model/split-screen-plan";
import { createFormatEdit } from "#/modules/viral-formats/server/create-format-edit.server";
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

async function createSplitScreenEdit(userId: string, plan: SplitScreenPlan): Promise<string> {
    return await createFormatEdit(userId, { format: "split-screen", plan });
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

    it("takes a batch out of Claude's queue once every video has an edit", async () => {
        const userId = await createPerson();
        const sessionId = await createEditSession(userId, "split-screen");
        const videoId = await createVideo(userId, "format");
        await addSessionVideo(userId, { sessionId, videoId });
        await queueEditSession(userId, sessionId);
        await createSplitScreenEdit(userId, planFor(videoId, sessionId));

        const queue = await listQueuedEditSessions(userId);

        expect(queue).toEqual([]);
    });

    it("keeps a Contraste batch on its own tool and queues one edit per video on retries", async () => {
        const userId = await createPerson();
        const sessionId = await createEditSession(userId, "this-or-that");
        const videoId = await createVideo(userId, "format");
        await addSessionVideo(userId, { sessionId, videoId });
        await queueEditSession(userId, sessionId);
        const queue = await listQueuedEditSessions(userId);
        expect(queue[0]).toMatchObject({
            sessionId,
            title: "Contraste #1",
            format: "this-or-that",
        });

        await expect(createSplitScreenEdit(userId, planFor(videoId, sessionId))).rejects.toThrow(
            "This tool does not match the batch's format.",
        );

        const plan = contrastPlanSchema.parse({
            ...planFor(videoId, sessionId),
            topic: "Ferramentas de edição",
            comparisons: [{ start: 0, end: 2, label: "Editor", verdict: "good" }],
        });
        const request = { format: "this-or-that", plan } as const;
        const [firstId, secondId] = await Promise.all([
            createFormatEdit(userId, request),
            createFormatEdit(userId, request),
        ]);

        expect(firstId).toBe(secondId);
        const session = await findUserEditSession(userId, sessionId);
        expect(session?.edits).toMatchObject([
            { id: firstId, format: "this-or-that", status: "queued" },
        ]);
    });

    it("leaves a failed raw video out of Claude's queue", async () => {
        const userId = await createPerson();
        const sessionId = await createEditSession(userId, "split-screen");
        const readyVideoId = await createVideo(userId, "format");
        const failedVideoId = await createVideo(userId, "format");
        await db.update(videos).set({ status: "failed" }).where(eq(videos.id, failedVideoId));
        await addSessionVideo(userId, { sessionId, videoId: readyVideoId });
        await addSessionVideo(userId, { sessionId, videoId: failedVideoId });
        await queueEditSession(userId, sessionId);

        const [batch] = await listQueuedEditSessions(userId);

        expect(batch?.videos.map((video) => video.videoId)).toEqual([readyVideoId]);
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
