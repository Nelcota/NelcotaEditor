import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { afterAll, expect, test } from "vitest";
import { db } from "#/db/database.server";
import { user } from "#/modules/auth/auth.schema";
import { findTranscriptWords } from "#/modules/transcription/server/find-transcript-words.server";
import { transcripts } from "#/modules/transcription/transcription.schema";
import { videos } from "#/modules/video-records/video-records.schema";

afterAll(async () => {
    await db.$client.end();
});

test("rejects null transcript arrays and keeps silent videos distinct from invalid saved words", async () => {
    const userId = randomUUID();
    const videoId = randomUUID();
    await db
        .insert(user)
        .values({ id: userId, name: "Test account", email: `${userId}@example.test` });

    try {
        await db.insert(videos).values({
            id: videoId,
            userId,
            title: "Test video",
            source: "upload",
            requestedClipCount: 1,
        });
        await expect(
            db.execute(
                sql`insert into ${transcripts} (video_id, words) values (${videoId}, 'null'::jsonb)`,
            ),
        ).rejects.toMatchObject({ cause: { constraint: "transcripts_words_array" } });
        await expect(
            db.execute(
                sql`insert into ${transcripts} (video_id, words) values (${videoId}, '[null]'::jsonb)`,
            ),
        ).rejects.toMatchObject({ cause: { constraint: "transcripts_words_array" } });
        await db.execute(
            sql`insert into ${transcripts} (video_id, words) values (${videoId}, '[{"text": null, "startSeconds": 0, "endSeconds": 1}]'::jsonb)`,
        );
        assert.equal(await findTranscriptWords(videoId), null);

        await db.update(transcripts).set({ words: [] }).where(eq(transcripts.videoId, videoId));
        assert.deepEqual(await findTranscriptWords(videoId), []);
    } finally {
        await db.delete(user).where(eq(user.id, userId));
    }
});
