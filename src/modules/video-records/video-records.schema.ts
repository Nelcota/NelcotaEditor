import { sql } from "drizzle-orm";
import {
    bigint,
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
import { CLIP_LENGTHS, DEFAULT_CLIP_LENGTH } from "#/modules/video-records/model/clip-length";
import { MAX_VIDEO_TITLE_LENGTH } from "#/modules/video-records/model/video-title";
import {
    MAX_CLIP_COUNT,
    MIN_CLIP_COUNT,
    VIDEO_PURPOSES,
    VIDEO_SOURCES,
    VIDEO_STATUSES,
} from "#/modules/video-records/model/video-status";

/** Constant values written into the CHECK; never user input. */
const PURPOSE_LIST = VIDEO_PURPOSES.map((purpose) => `'${purpose}'`).join(", ");

export const videoStatusEnum = pgEnum("video_status", VIDEO_STATUSES);
export const videoSourceEnum = pgEnum("video_source", VIDEO_SOURCES);
export const clipLengthEnum = pgEnum("clip_length", CLIP_LENGTHS);

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
        // Size of the source file, written with it, so usage and quota never walk the disk.
        // Null until the file exists (or for rows the worker has not backfilled yet).
        sourceBytes: bigint("source_bytes", { mode: "number" }),
        // A frame taken by the worker; YouTube videos fall back to YouTube's own thumbnail.
        thumbnailPath: text("thumbnail_path"),
        durationSeconds: doublePrecision("duration_seconds"),
        // What the video is for; a format video asks for no clips (count 0).
        purpose: text("purpose", { enum: VIDEO_PURPOSES }).notNull().default("clips"),
        requestedClipCount: integer("requested_clip_count").notNull(),
        // Copied from the user's preferences (or picked when sending), like the clip count.
        clipLength: clipLengthEnum("clip_length").notNull().default(DEFAULT_CLIP_LENGTH),
        // Copied from the user's preferences when the video is created; null = detect it.
        transcriptionLanguage: text("transcription_language"),
        status: videoStatusEnum("status").notNull().default("queued"),
        progressPercent: integer("progress_percent").notNull().default(0),
        // Set by the user; the worker polls it and stops the running step.
        cancelRequested: boolean("cancel_requested").notNull().default(false),
        errorMessage: text("error_message"),
        // When the worker last stopped touching the video (done, failed or cancelled).
        finishedAt: timestamp("finished_at", { withTimezone: true }),
        // When the video first reached done, kept through every later retry or Studio render
        // (which reset finishedAt). The Painel's time per video runs from createdAt to here.
        firstFinishedAt: timestamp("first_finished_at", { withTimezone: true }),
        // A migrated video was already done, but its first completion cannot be dated.
        hasUnrecordedFirstFinish: boolean("has_unrecorded_first_finish").notNull().default(false),
        // When the current run was asked for (creation, retry or a Studio render). The running
        // run's time left is measured from here: createdAt would count the days between a video
        // and its re-render. Null for videos from before this column.
        processingStartedAt: timestamp("processing_started_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        // Every list is "this user's videos, newest first".
        index("videos_user_id_created_at_idx").on(table.userId, table.createdAt.desc()),
        check("videos_purpose_known", sql`${table.purpose} in (${sql.raw(PURPOSE_LIST)})`),
        check(
            "videos_requested_clip_count_range",
            sql`(${table.purpose} = 'format' and ${table.requestedClipCount} = 0) or (${table.purpose} = 'clips' and ${table.requestedClipCount} between ${sql.raw(String(MIN_CLIP_COUNT))} and ${sql.raw(String(MAX_CLIP_COUNT))})`,
        ),
        check(
            "videos_source_bytes_positive",
            sql`${table.sourceBytes} is null or ${table.sourceBytes} >= 0`,
        ),
        check("videos_progress_percent_range", sql`${table.progressPercent} between 0 and 100`),
        check(
            "videos_duration_seconds_positive",
            sql`${table.durationSeconds} is null or ${table.durationSeconds} > 0`,
        ),
        check(
            "videos_duration_seconds_finite",
            sql`${table.durationSeconds} is null or ${table.durationSeconds} < 'Infinity'::double precision`,
        ),
        check(
            "videos_title_length",
            sql`char_length(${table.title}) between 1 and ${sql.raw(String(MAX_VIDEO_TITLE_LENGTH))}`,
        ),
    ],
);

export type Video = typeof videos.$inferSelect;
