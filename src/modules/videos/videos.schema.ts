import {
    boolean,
    doublePrecision,
    index,
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { user } from "#/modules/auth/auth.schema";
import { VIDEO_SOURCES, VIDEO_STATUSES } from "#/modules/videos/video-status";

export const videoStatusEnum = pgEnum("video_status", VIDEO_STATUSES);
export const videoSourceEnum = pgEnum("video_source", VIDEO_SOURCES);

export const videos = pgTable(
    "videos",
    {
        id: uuid("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        source: videoSourceEnum("source").notNull(),
        sourceUrl: text("source_url"),
        sourcePath: text("source_path"),
        // A frame taken by the worker; YouTube videos fall back to YouTube's own thumbnail.
        thumbnailPath: text("thumbnail_path"),
        durationSeconds: doublePrecision("duration_seconds"),
        requestedClipCount: integer("requested_clip_count").notNull(),
        // Copied from the user's preferences when the video is created; null = detect it.
        transcriptionLanguage: text("transcription_language"),
        status: videoStatusEnum("status").notNull().default("queued"),
        progressPercent: integer("progress_percent").notNull().default(0),
        // Set by the user; the worker polls it and stops the running step.
        cancelRequested: boolean("cancel_requested").notNull().default(false),
        errorMessage: text("error_message"),
        // When the worker last stopped touching the video (done, failed or cancelled).
        finishedAt: timestamp("finished_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("videos_user_id_idx").on(table.userId)],
);

export type Video = typeof videos.$inferSelect;
