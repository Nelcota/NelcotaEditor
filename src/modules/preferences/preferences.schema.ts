import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "#/modules/auth/auth.schema";
import { DEFAULT_CLIP_COUNT } from "#/modules/videos/video-status";

/** One row per user, created on first save; missing rows mean the defaults. */
export const userPreferences = pgTable("user_preferences", {
    userId: text("user_id")
        .primaryKey()
        .references(() => user.id, { onDelete: "cascade" }),
    defaultClipCount: integer("default_clip_count").notNull().default(DEFAULT_CLIP_COUNT),
    // Empty string = let Whisper detect the language.
    transcriptionLanguage: text("transcription_language").notNull().default(""),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});
