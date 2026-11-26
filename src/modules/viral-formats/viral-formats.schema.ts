import { sql } from "drizzle-orm";
import {
    bigint,
    check,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    unique,
    uuid,
} from "drizzle-orm/pg-core";
import { user } from "#/modules/auth/auth.schema";
import { videos } from "#/modules/video-records/video-records.schema";
import {
    EDIT_SESSION_STATUSES,
    MAX_SESSION_NOTE_LENGTH,
} from "#/modules/viral-formats/model/edit-session";
import { EDIT_FORMATS, EDIT_STATUSES } from "#/modules/viral-formats/model/edit-status";
import type { ContrastPlan } from "#/modules/viral-formats/model/contrast-plan";
import { MAX_EDIT_TITLE_LENGTH } from "#/modules/viral-formats/model/presenter-plan";
import type { SplitScreenPlan } from "#/modules/viral-formats/model/split-screen-plan";

/** Constant values written into the CHECKs; never user input. */
const EDIT_STATUS_LIST = EDIT_STATUSES.map((status) => `'${status}'`).join(", ");
const EDIT_FORMAT_LIST = EDIT_FORMATS.map((format) => `'${format}'`).join(", ");
const SESSION_STATUS_LIST = EDIT_SESSION_STATUSES.map((status) => `'${status}'`).join(", ");

/**
 * A batch the person prepares for one format: the raw videos and the adjustments for all of them.
 * The number counts the person's edits in that format ("Tela dividida #2").
 */
export const editSessions = pgTable(
    "edit_sessions",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`uuidv7()`),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        format: text("format", { enum: EDIT_FORMATS }).notNull(),
        number: integer("number").notNull(),
        status: text("status", { enum: EDIT_SESSION_STATUSES }).notNull().default("collecting"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        check(
            "edit_sessions_status_known",
            sql`${table.status} in (${sql.raw(SESSION_STATUS_LIST)})`,
        ),
        check("edit_sessions_format_known", sql`${table.format} in (${sql.raw(EDIT_FORMAT_LIST)})`),
        check("edit_sessions_number_positive", sql`${table.number} >= 1`),
        unique("edit_sessions_user_format_number_unique").on(
            table.userId,
            table.format,
            table.number,
        ),
        index("edit_sessions_user_id_created_at_idx").on(table.userId, table.createdAt.desc()),
    ],
);

/** The raw videos in a batch; a video belongs to one batch at most. */
export const editSessionVideos = pgTable(
    "edit_session_videos",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`uuidv7()`),
        sessionId: uuid("session_id")
            .notNull()
            .references(() => editSessions.id, { onDelete: "cascade" }),
        videoId: uuid("video_id")
            .notNull()
            .unique()
            .references(() => videos.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("edit_session_videos_session_id_idx").on(table.sessionId)],
);

/** What the person asks for every video of the batch, in their own words, oldest first. */
export const editSessionNotes = pgTable(
    "edit_session_notes",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`uuidv7()`),
        sessionId: uuid("session_id")
            .notNull()
            .references(() => editSessions.id, { onDelete: "cascade" }),
        body: text("body").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        check(
            "edit_session_notes_body_length",
            sql`char_length(${table.body}) between 1 and ${sql.raw(String(MAX_SESSION_NOTE_LENGTH))}`,
        ),
        index("edit_session_notes_session_id_idx").on(table.sessionId),
    ],
);

/**
 * One raw video edited into a viral format by the person's Claude. The plan is the format's own
 * instructions, validated against its Zod schema before it is stored, so its shape is known.
 */
export const edits = pgTable(
    "edits",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`uuidv7()`),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        // The raw talking head; its folder in storage also holds the edit's file.
        videoId: uuid("video_id")
            .notNull()
            .references(() => videos.id, { onDelete: "cascade" }),
        // The batch it came from; edits made straight from Claude belong to none.
        sessionId: uuid("session_id").references(() => editSessions.id, { onDelete: "set null" }),
        title: text("title").notNull(),
        format: text("format", { enum: EDIT_FORMATS }).notNull(),
        status: text("status", { enum: EDIT_STATUSES }).notNull().default("queued"),
        plan: jsonb("plan").$type<SplitScreenPlan | ContrastPlan>().notNull(),
        outputPath: text("output_path"),
        outputBytes: bigint("output_bytes", { mode: "number" }),
        errorMessage: text("error_message"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        check("edits_status_known", sql`${table.status} in (${sql.raw(EDIT_STATUS_LIST)})`),
        check("edits_format_known", sql`${table.format} in (${sql.raw(EDIT_FORMAT_LIST)})`),
        check(
            "edits_title_length",
            sql`char_length(${table.title}) between 1 and ${sql.raw(String(MAX_EDIT_TITLE_LENGTH))}`,
        ),
        check(
            "edits_done_has_output",
            sql`${table.status} <> 'done' or ${table.outputPath} is not null`,
        ),
        index("edits_user_id_created_at_idx").on(table.userId, table.createdAt.desc()),
        index("edits_video_id_idx").on(table.videoId),
        index("edits_session_id_idx").on(table.sessionId),
    ],
);

export type Edit = typeof edits.$inferSelect;
