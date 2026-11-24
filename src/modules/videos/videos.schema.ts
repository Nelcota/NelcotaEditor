import { sql } from "drizzle-orm";
import { bigint, check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "#/modules/auth/auth.schema";
import { clipLengthEnum } from "#/modules/video-records/video-records.schema";

/**
 * An upload the browser is sending straight to storage. The row holds the space and the processing
 * slot it was granted until the upload is confirmed (then it becomes a video) or expires. Its id is
 * the id the video will have, so the file is stored under the video's folder from the start.
 */
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
        requestedClipCount: integer("requested_clip_count").notNull(),
        clipLength: clipLengthEnum("clip_length").notNull(),
        // "" means "detect automatically", as on the video row.
        transcriptionLanguage: text("transcription_language").notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
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
    ],
);

export type VideoUpload = typeof videoUploads.$inferSelect;
