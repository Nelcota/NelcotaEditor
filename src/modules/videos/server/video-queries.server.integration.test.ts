import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { afterAll, describe, expect, test } from "vitest";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { videos } from "#/modules/video-records/video-records.schema";
import { MAX_VIDEOS_PER_PAGE, videoListInputSchema } from "#/modules/videos/model/video-list-page";
import type { VideoListInput, VideoListPage } from "#/modules/videos/model/video-list-page";
import type { VideoSort } from "#/modules/videos/model/video-sort";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { countUserVideos, listUserVideosPage } from "#/modules/videos/server/video-queries.server";

// Runs against the test database from .env.test: bun run test:integration

const REQUESTED_CLIP_COUNT = 3;
// Far more pages than any test needs; a cursor that never ends fails instead of hanging.
const MAX_PAGES = 50;

interface TestVideo {
    title: string;
    status?: VideoStatus;
    /** A Postgres timestamp literal, so several videos can share one millisecond. */
    createdAt?: string;
}

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

async function insertVideos(userId: string, testVideos: Array<TestVideo>): Promise<Array<string>> {
    const rows = testVideos.map((video) => {
        const createdAt = video.createdAt ?? "2026-11-20 12:00:00+00";

        return {
            id: randomUUID(),
            userId,
            title: video.title,
            source: "upload" as const,
            requestedClipCount: REQUESTED_CLIP_COUNT,
            status: video.status ?? "done",
            createdAt: sql`${createdAt}::timestamptz`,
        };
    });
    await db.insert(videos).values(rows);

    return rows.map((row) => row.id);
}

function firstPageInput(sort: VideoSort, limit: number): VideoListInput {
    return { query: "", filter: "all", sort, cursor: null, limit };
}

async function listEveryPage(
    userId: string,
    firstInput: VideoListInput,
): Promise<Array<VideoSummary>> {
    const listed: Array<VideoSummary> = [];
    let input = firstInput;

    for (let pageNumber = 0; pageNumber < MAX_PAGES; pageNumber += 1) {
        const page: VideoListPage = await listUserVideosPage(userId, input);
        listed.push(...page.items);

        if (page.nextCursor === null) {
            return listed;
        }

        input = { ...input, cursor: page.nextCursor };
    }

    throw new Error(`The list did not end after ${MAX_PAGES} pages`);
}

afterAll(async () => {
    await db.$client.end();
});

describe("listUserVideosPage", () => {
    test("never returns another user's videos", async () => {
        const userId = await createTestUser();
        const otherUserId = await createTestUser();
        await insertVideos(userId, [{ title: "Meu vídeo" }]);
        await insertVideos(otherUserId, [{ title: "Vídeo alheio" }]);

        const page = await listUserVideosPage(userId, firstPageInput("newest", 10));

        expect(page.items.map((video) => video.title)).toEqual(["Meu vídeo"]);
        expect(page.totalCount).toBe(1);
    });

    test("returns only the user's videos when the cursor carries another user's video", async () => {
        const userId = await createTestUser();
        const otherUserId = await createTestUser();
        await insertVideos(userId, [
            { title: "Antigo", createdAt: "2026-11-01 12:00:00+00" },
            { title: "Recente", createdAt: "2026-11-03 12:00:00+00" },
        ]);
        const [otherVideoId] = await insertVideos(otherUserId, [
            { title: "Alheio", createdAt: "2026-11-05 12:00:00+00" },
        ]);

        if (otherVideoId === undefined) {
            throw new Error("The other user's video was not inserted");
        }

        const page = await listUserVideosPage(userId, {
            ...firstPageInput("newest", 10),
            cursor: { id: otherVideoId, createdAt: "2026-11-05T12:00:00.000Z", title: "Alheio" },
        });

        expect(page.items.map((video) => video.title)).toEqual(["Recente", "Antigo"]);
    });

    test("pages videos created in the same millisecond without duplicates or gaps", async () => {
        const userId = await createTestUser();
        const videoIds = await insertVideos(userId, [
            { title: "Um", createdAt: "2026-11-20 12:00:00.123100+00" },
            { title: "Dois", createdAt: "2026-11-20 12:00:00.123200+00" },
            { title: "Três", createdAt: "2026-11-20 12:00:00.123300+00" },
            { title: "Quatro", createdAt: "2026-11-20 12:00:00.123400+00" },
            { title: "Cinco", createdAt: "2026-11-20 12:00:00.123500+00" },
        ]);
        const idsNewestFirst = videoIds.toSorted().toReversed();

        const listed = await listEveryPage(userId, firstPageInput("newest", 2));

        expect(listed.map((video) => video.id)).toEqual(idsNewestFirst);
    });

    test("pages the oldest first by id when videos share a millisecond", async () => {
        const userId = await createTestUser();
        const videoIds = await insertVideos(userId, [
            { title: "Um", createdAt: "2026-11-20 12:00:00.123100+00" },
            { title: "Dois", createdAt: "2026-11-20 12:00:00.123900+00" },
            { title: "Três", createdAt: "2026-11-20 12:00:00.123500+00" },
        ]);

        const listed = await listEveryPage(userId, firstPageInput("oldest", 1));

        expect(listed.map((video) => video.id)).toEqual(videoIds.toSorted());
    });

    test("sorts titles without case or accents and pages equal titles by id", async () => {
        const userId = await createTestUser();
        const editionIds = await insertVideos(userId, [{ title: "Édição" }, { title: "edicao" }]);
        const sameTitleIds = await insertVideos(userId, [
            { title: "Mesmo" },
            { title: "Mesmo" },
            { title: "Mesmo" },
        ]);
        await insertVideos(userId, [{ title: "Abertura" }, { title: "Zebra" }]);
        const wholeList = await listUserVideosPage(userId, firstPageInput("title", 10));

        const listed = await listEveryPage(userId, firstPageInput("title", 2));

        const listedIds = listed.map((video) => video.id);
        const editionPosition = listedIds.findIndex((videoId) => editionIds.includes(videoId));
        expect(listedIds).toEqual(wholeList.items.map((video) => video.id));
        expect(new Set(listedIds).size).toBe(7);
        expect(listed.map((video) => video.title).at(0)).toBe("Abertura");
        expect(listed.map((video) => video.title).at(-1)).toBe("Zebra");
        expect(listedIds.slice(editionPosition, editionPosition + 2).toSorted()).toEqual(
            editionIds.toSorted(),
        );
        expect(listedIds.filter((videoId) => sameTitleIds.includes(videoId))).toEqual(
            sameTitleIds.toSorted(),
        );
    });

    test("counts every match of the filter and the search, not only the page", async () => {
        const userId = await createTestUser();
        await insertVideos(userId, [
            { title: "Corte da entrevista", status: "done" },
            { title: "Corte do podcast", status: "done" },
            { title: "Corte da aula", status: "failed" },
            { title: "Outro assunto", status: "done" },
        ]);

        const page = await listUserVideosPage(userId, {
            query: "CORTE",
            filter: "done",
            sort: "newest",
            cursor: null,
            limit: 1,
        });

        expect(page.items).toHaveLength(1);
        expect(page.totalCount).toBe(2);
        expect(page.nextCursor).not.toBeNull();
    });

    test("ends the list with a null cursor on the last page", async () => {
        const userId = await createTestUser();
        await insertVideos(userId, [
            { title: "Um", createdAt: "2026-11-01 12:00:00+00" },
            { title: "Dois", createdAt: "2026-11-02 12:00:00+00" },
            { title: "Três", createdAt: "2026-11-03 12:00:00+00" },
        ]);
        const firstPage = await listUserVideosPage(userId, firstPageInput("newest", 2));

        if (firstPage.nextCursor === null) {
            throw new Error("The first page should point to a second one");
        }

        const lastPage = await listUserVideosPage(userId, {
            ...firstPageInput("newest", 2),
            cursor: firstPage.nextCursor,
        });

        expect(lastPage.items.map((video) => video.title)).toEqual(["Um"]);
        expect(lastPage.nextCursor).toBeNull();
    });

    test("ends the list with a null cursor when the page is exactly full", async () => {
        const userId = await createTestUser();
        await insertVideos(userId, [{ title: "Um" }, { title: "Dois" }]);

        const page = await listUserVideosPage(userId, firstPageInput("newest", 2));

        expect(page.items).toHaveLength(2);
        expect(page.nextCursor).toBeNull();
    });
});

describe("videoListInputSchema", () => {
    test("rejects a page larger than the maximum", () => {
        const result = videoListInputSchema.safeParse(
            firstPageInput("newest", MAX_VIDEOS_PER_PAGE + 1),
        );

        expect(result.success).toBe(false);
    });

    test("accepts a page of exactly the maximum", () => {
        const result = videoListInputSchema.safeParse(
            firstPageInput("newest", MAX_VIDEOS_PER_PAGE),
        );

        expect(result.success).toBe(true);
    });
});

describe("countUserVideos", () => {
    test("counts only the user's videos, per status filter", async () => {
        const userId = await createTestUser();
        const otherUserId = await createTestUser();
        await insertVideos(userId, [
            { title: "Pronto", status: "done" },
            { title: "Falhou", status: "failed" },
            { title: "Na fila", status: "queued" },
            { title: "Transcrevendo", status: "transcribing" },
        ]);
        await insertVideos(otherUserId, [{ title: "Alheio", status: "done" }]);

        const counts = await countUserVideos(userId);

        expect(counts).toEqual({ all: 4, processing: 2, done: 1, failed: 1, cancelled: 0 });
    });
});
