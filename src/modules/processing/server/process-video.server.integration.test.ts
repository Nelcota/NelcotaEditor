import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, describe, test, vi } from "vitest";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import type { Clip } from "#/modules/clips/clips.schema";
import { processVideo } from "#/modules/processing/server/process-video.server";
import { renderPendingClips } from "#/modules/processing/server/render-pending-clips.server";
import { requestVideoCancellation } from "#/modules/video-records/server/stop-video.server";
import { findVideoById, toVideoRun } from "#/modules/video-records/server/video-progress.server";
import { videos } from "#/modules/video-records/video-records.schema";
import type { Video } from "#/modules/video-records/video-records.schema";
import { getEnvironment } from "#/shared/server/env.server";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";
import { getVideoDirectory } from "#/shared/server/storage.server";

interface MediaOptions {
    cancelSignal?: AbortSignal;
    cwd?: string;
}

const runMediaTool = vi.hoisted(() =>
    vi.fn<
        (
            command: string,
            args: ReadonlyArray<string>,
            options: MediaOptions,
        ) => void | Promise<void>
    >(),
);

vi.mock("execa", async (importOriginal) => {
    const original = await importOriginal<typeof import("execa")>();

    return {
        ...original,
        execa(command: string, args: ReadonlyArray<string>, options: MediaOptions) {
            const run = async (): Promise<{ stdout: string }> => {
                await runMediaTool(command, args, options);
                return { stdout: "" };
            };
            return Object.assign(run(), { iterable: (): Array<string> => [] });
        },
    };
});

const GIGABYTE = 1024 * 1024 * 1024;
const CLIP_BYTES = 128;

async function insertVideo(sourceBytes: number | null = null): Promise<Video> {
    const userId = randomUUID();
    const videoId = randomUUID();
    await db.execute(
        sql`insert into "user" (id, name, email) values (${userId}, 'Test account', ${`${userId}@example.com`})`,
    );
    await db.insert(videos).values({
        id: videoId,
        userId,
        title: "Test video",
        source: "youtube",
        sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        requestedClipCount: 2,
        processingStartedAt: new Date(),
        sourceBytes,
    });
    const video = await findVideoById(videoId);
    assert.ok(video);
    return video;
}

async function insertClips(videoId: string, statuses: Array<Clip["status"]>): Promise<Array<Clip>> {
    return db
        .insert(clips)
        .values(
            statuses.map((status, index): typeof clips.$inferInsert => ({
                videoId,
                status,
                position: index + 1,
                title: "Test clip",
                reason: "Test reason",
                startSeconds: 0,
                endSeconds: 30,
                score: 80,
                captionStyle: "none",
            })),
        )
        .returning();
}

async function writeTestRender(
    command: string,
    args: ReadonlyArray<string>,
    options: MediaOptions,
): Promise<void> {
    const outputName = args.at(-1);
    assert.equal(command, "ffmpeg");
    assert.ok(outputName);
    assert.ok(options.cwd);
    await writeFile(path.join(options.cwd, outputName), new Uint8Array(CLIP_BYTES));
}

async function renderTestClips(video: Video, videoClips: Array<Clip>): Promise<void> {
    const workDirectory = await mkdtemp(path.join(tmpdir(), "nelcota-render-"));
    runMediaTool.mockImplementation(writeTestRender);

    try {
        await renderPendingClips({
            run: toVideoRun(video),
            userId: video.userId,
            localSourcePath: path.join(workDirectory, "source.mp4"),
            workDirectory,
            clips: videoClips,
            words: [],
            signal: new AbortController().signal,
        });
    } finally {
        await rm(workDirectory, { recursive: true, force: true });
    }
}

afterEach(() => {
    runMediaTool.mockReset();
});

afterAll(async () => {
    await db.$client.end();
});

describe("processVideo", () => {
    test("aborts an active tool and leaves the video recoverable when the queue stops the job", async () => {
        const video = await insertVideo();
        await insertClips(video.id, ["rendering"]);
        const controller = new AbortController();
        const interruption = new Error("Queue job interrupted");
        runMediaTool.mockImplementation((_command, _args, options) => {
            controller.abort(interruption);
            options.cancelSignal?.throwIfAborted();
        });

        await assert.rejects(processVideo(video.id, controller.signal), interruption);

        assert.equal(runMediaTool.mock.calls.length, 1);
        assert.equal((await findVideoById(video.id))?.status, "downloading");
        const savedClips = await db
            .select({ status: clips.status })
            .from(clips)
            .where(eq(clips.videoId, video.id));
        assert.deepEqual(savedClips, [{ status: "pending" }]);
    });

    test("records cancellation when a tool fails right after the user cancels", async () => {
        const video = await insertVideo();
        runMediaTool.mockImplementation(async () => {
            await requestVideoCancellation(video.id);
            throw new Error("Download failed");
        });

        await processVideo(video.id, new AbortController().signal);

        assert.equal((await findVideoById(video.id))?.status, "cancelled");
    });
});

describe("renderPendingClips", () => {
    test("renders only the clip selected for retry", async () => {
        const video = await insertVideo();
        const videoClips = await insertClips(video.id, ["pending", "failed"]);

        try {
            await renderTestClips(video, videoClips);

            const savedClips = await db
                .select({ status: clips.status })
                .from(clips)
                .where(eq(clips.videoId, video.id))
                .orderBy(asc(clips.position));
            assert.deepEqual(
                savedClips.map((clip) => clip.status),
                ["done", "failed"],
            );
        } finally {
            await getFileStorage().deleteFolder(getVideoDirectory(video.id));
        }
    });

    test("keeps only the output that fits when two renders finish concurrently", async () => {
        const quotaBytes = getEnvironment().STORAGE_QUOTA_GIGABYTES * GIGABYTE;
        const video = await insertVideo(Math.floor(quotaBytes) - CLIP_BYTES);
        const videoClips = await insertClips(video.id, ["pending", "pending"]);

        try {
            await renderTestClips(video, videoClips);

            const savedClips = await db
                .select({ status: clips.status, outputBytes: clips.outputBytes })
                .from(clips)
                .where(eq(clips.videoId, video.id))
                .orderBy(asc(clips.status));
            assert.deepEqual(savedClips, [
                { status: "done", outputBytes: CLIP_BYTES },
                { status: "failed", outputBytes: null },
            ]);
        } finally {
            await getFileStorage().deleteFolder(getVideoDirectory(video.id));
        }
    });
});
