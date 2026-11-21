import { sql } from "drizzle-orm";
import {
    boolean,
    check,
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
import { MAX_VIDEO_TITLE_LENGTH } from "#/modules/videos/video-title";
import {
    MAX_CLIP_COUNT,
    MIN_CLIP_COUNT,
    VIDEO_SOURCES,
    VIDEO_STATUSES,
} from "#/modules/videos/video-status";

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
        // When the current run was asked for (creation, retry or a Studio render). Processing time
        // is measured from here: createdAt would count the days between a video and its re-render.
        // Null for videos from before this column, which the averages leave out.
        processingStartedAt: timestamp("processing_started_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        // Every list is "this user's videos, newest first".
        index("videos_user_id_created_at_idx").on(table.userId, table.createdAt.desc()),
        check(
            "videos_requested_clip_count_range",
            sql`${table.requestedClipCount} between ${sql.raw(String(MIN_CLIP_COUNT))} and ${sql.raw(String(MAX_CLIP_COUNT))}`,
        ),
        check("videos_progress_percent_range", sql`${table.progressPercent} between 0 and 100`),
        check(
            "videos_duration_seconds_positive",
            sql`${table.durationSeconds} is null or ${table.durationSeconds} > 0`,
        ),
        check(
            "videos_title_length",
            sql`char_length(${table.title}) between 1 and ${sql.raw(String(MAX_VIDEO_TITLE_LENGTH))}`,
        ),
    ],
);

export type Video = typeof videos.$inferSelect;
