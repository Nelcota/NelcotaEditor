import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { TranscriptWord } from "#/modules/transcription/transcript-word";
import { videos } from "#/modules/videos/videos.schema";

export const transcripts = pgTable("transcripts", {
    videoId: uuid("video_id")
        .primaryKey()
        .references(() => videos.id, { onDelete: "cascade" }),
    language: text("language"),
    words: jsonb("words").$type<Array<TranscriptWord>>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
