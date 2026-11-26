import { sql } from "drizzle-orm";
import { bigint, check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "#/modules/auth/auth.schema";
import { MAX_UPLOAD_BYTES } from "#/modules/video-records/model/upload-limits";
import { MAX_VIDEO_TITLE_LENGTH } from "#/modules/video-records/model/video-title";
import {
    MAX_CLIP_COUNT,
    MIN_CLIP_COUNT,
    VIDEO_PURPOSES,
} from "#/modules/video-records/model/video-status";
import { clipLengthEnum } from "#/modules/video-records/video-records.schema";

/**
 * An upload the browser is sending straight to storage. The row holds the space and the processing
 * slot it was granted until the upload is confirmed (then it becomes a video), cancelled or expires. Its id is
 * the id the video will have, so the file is stored under the video's folder from the start.
 */
/** Constant values written into the CHECK; never user input. */
const PURPOSE_LIST = VIDEO_PURPOSES.map((purpose) => `'${purpose}'`).join(", ");

export const videoUploads = pgTable(
    "video_uploads",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`uuidv7()`),
        // Null once the account is deleted: the row then waits for the sweep of expired uploads,
        // which also deletes whatever file was already sent.
        userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
        sourcePath: text("source_path").notNull(),
        declaredBytes: bigint("declared_bytes", { mode: "number" }).notNull(),
        title: text("title").notNull(),
        purpose: text("purpose", { enum: VIDEO_PURPOSES }).notNull().default("clips"),
        requestedClipCount: integer("requested_clip_count").notNull(),
        clipLength: clipLengthEnum("clip_length").notNull(),
        // "" means "detect automatically", as on the video row.
        transcriptionLanguage: text("transcription_language").notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        // Set when the upload is cancelled or its video deleted. The upload link may still write
        // the file until expires_at, so the row frees the processing slot but keeps holding the
        // space, and the sweep deletes whatever arrived once it expires.
        cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        // Every read is "this user's unexpired uploads" or "every expired upload".
        index("video_uploads_user_id_expires_at_idx").on(table.userId, table.expiresAt),
        index("video_uploads_expires_at_idx").on(table.expiresAt),
        check("video_uploads_declared_bytes_positive", sql`${table.declaredBytes} > 0`),
        // The row becomes a video as is, so it holds the video's own limits; a value that slipped
        // past them would only fail at confirmation, after the whole file was sent.
        check(
            "video_uploads_declared_bytes_max",
            sql`${table.declaredBytes} <= ${sql.raw(String(MAX_UPLOAD_BYTES))}`,
        ),
        check("video_uploads_purpose_known", sql`${table.purpose} in (${sql.raw(PURPOSE_LIST)})`),
        check(
            "video_uploads_requested_clip_count_range",
            sql`(${table.purpose} = 'format' and ${table.requestedClipCount} = 0) or (${table.purpose} = 'clips' and ${table.requestedClipCount} between ${sql.raw(String(MIN_CLIP_COUNT))} and ${sql.raw(String(MAX_CLIP_COUNT))})`,
        ),
        check(
            "video_uploads_title_length",
            sql`char_length(${table.title}) between 1 and ${sql.raw(String(MAX_VIDEO_TITLE_LENGTH))}`,
        ),
    ],
);

export type VideoUpload = typeof videoUploads.$inferSelect;
