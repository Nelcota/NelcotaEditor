import { sql } from "drizzle-orm";
import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import { videos } from "#/modules/video-records/video-records.schema";
import { check, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const transcripts = pgTable(
    "transcripts",
    {
        videoId: uuid("video_id")
            .primaryKey()
            .references(() => videos.id, { onDelete: "cascade" }),
        language: text("language"),
        words: jsonb("words").$type<Array<TranscriptWord>>().notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        check(
            "transcripts_words_array",
            sql`jsonb_typeof(${table.words}) = 'array' and not ${table.words} @> '[null]'::jsonb`,
        ),
    ],
);
