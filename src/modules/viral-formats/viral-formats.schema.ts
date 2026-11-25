import { sql } from "drizzle-orm";
import { bigint, check, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "#/modules/auth/auth.schema";
import { videos } from "#/modules/video-records/video-records.schema";
import { EDIT_FORMATS, EDIT_STATUSES } from "#/modules/viral-formats/model/edit-status";
import { MAX_EDIT_TITLE_LENGTH } from "#/modules/viral-formats/model/split-screen-plan";
import type { SplitScreenPlan } from "#/modules/viral-formats/model/split-screen-plan";

/** Constant values written into the CHECKs; never user input. */
const EDIT_STATUS_LIST = EDIT_STATUSES.map((status) => `'${status}'`).join(", ");
const EDIT_FORMAT_LIST = EDIT_FORMATS.map((format) => `'${format}'`).join(", ");

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
        title: text("title").notNull(),
        format: text("format", { enum: EDIT_FORMATS }).notNull(),
        status: text("status", { enum: EDIT_STATUSES }).notNull().default("queued"),
        plan: jsonb("plan").$type<SplitScreenPlan>().notNull(),
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
    ],
);

export type Edit = typeof edits.$inferSelect;
