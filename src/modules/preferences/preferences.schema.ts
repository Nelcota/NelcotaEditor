import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "#/modules/auth/auth.schema";
import { DEFAULT_CLIP_LENGTH } from "#/modules/video-records/clip-length";
import { clipLengthEnum } from "#/modules/video-records/videos.schema";
import {
    DEFAULT_CLIP_COUNT,
    MAX_CLIP_COUNT,
    MIN_CLIP_COUNT,
} from "#/modules/video-records/video-status";

/** One row per user, created on first save; missing rows mean the defaults. */
export const userPreferences = pgTable(
    "user_preferences",
    {
        userId: text("user_id")
            .primaryKey()
            .references(() => user.id, { onDelete: "cascade" }),
        defaultClipCount: integer("default_clip_count").notNull().default(DEFAULT_CLIP_COUNT),
        defaultClipLength: clipLengthEnum("default_clip_length")
            .notNull()
            .default(DEFAULT_CLIP_LENGTH),
        // Empty string = let Whisper detect the language.
        transcriptionLanguage: text("transcription_language").notNull().default(""),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        check(
            "user_preferences_default_clip_count_range",
            sql`${table.defaultClipCount} between ${sql.raw(String(MIN_CLIP_COUNT))} and ${sql.raw(String(MAX_CLIP_COUNT))}`,
        ),
    ],
);
