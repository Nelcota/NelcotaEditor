import { sql } from "drizzle-orm";
import {
    bigint,
    check,
    doublePrecision,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import {
    CAPTION_COLORS,
    CAPTION_FONTS,
    CAPTION_POSITIONS,
    CAPTION_SIZES,
    DEFAULT_CAPTION_COLOR,
    DEFAULT_CAPTION_FONT,
    DEFAULT_CAPTION_POSITION,
    DEFAULT_CAPTION_SIZE,
} from "#/modules/clips/caption-style";
import type { CaptionCue, StudioDraft } from "#/modules/clips/clip-studio.schema";
import {
    ASPECT_RATIOS,
    CAPTION_STYLES,
    DEFAULT_ASPECT_RATIO,
    DEFAULT_CAPTION_STYLE,
} from "#/modules/clips/clip-format";
import { CLIP_STATUSES } from "#/modules/clips/clip-status";
import { MAX_SCORE, MIN_SCORE } from "#/modules/clips/clip-limits";
import { videos } from "#/modules/video-records/videos.schema";

export const clipStatusEnum = pgEnum("clip_status", CLIP_STATUSES);
export const aspectRatioEnum = pgEnum("clip_aspect_ratio", ASPECT_RATIOS);
export const captionStyleEnum = pgEnum("clip_caption_style", CAPTION_STYLES);
export const captionColorEnum = pgEnum("clip_caption_color", CAPTION_COLORS);
export const captionSizeEnum = pgEnum("clip_caption_size", CAPTION_SIZES);
export const captionPositionEnum = pgEnum("clip_caption_position", CAPTION_POSITIONS);
export const captionFontEnum = pgEnum("clip_caption_font", CAPTION_FONTS);

export const clips = pgTable(
    "clips",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        videoId: uuid("video_id")
            .notNull()
            .references(() => videos.id, { onDelete: "cascade" }),
        position: integer("position").notNull(),
        title: text("title").notNull(),
        reason: text("reason").notNull(),
        startSeconds: doublePrecision("start_seconds").notNull(),
        endSeconds: doublePrecision("end_seconds").notNull(),
        score: integer("score").notNull(),
        status: clipStatusEnum("status").notNull().default("pending"),
        outputPath: text("output_path"),
        // Size of the rendered file, written with outputPath and cleared with it.
        outputBytes: bigint("output_bytes", { mode: "number" }),
        aspectRatio: aspectRatioEnum("aspect_ratio").notNull().default(DEFAULT_ASPECT_RATIO),
        captionStyle: captionStyleEnum("caption_style").notNull().default(DEFAULT_CAPTION_STYLE),
        captionColor: captionColorEnum("caption_color").notNull().default(DEFAULT_CAPTION_COLOR),
        captionSize: captionSizeEnum("caption_size").notNull().default(DEFAULT_CAPTION_SIZE),
        captionPosition: captionPositionEnum("caption_position")
            .notNull()
            .default(DEFAULT_CAPTION_POSITION),
        captionFont: captionFontEnum("caption_font").notNull().default(DEFAULT_CAPTION_FONT),
        // Captions edited in the Studio; null means they come straight from the transcript.
        captionCues: jsonb("caption_cues").$type<Array<CaptionCue>>(),
        // Studio edits not rendered yet. The version guards against two tabs overwriting each other.
        studioDraft: jsonb("studio_draft").$type<StudioDraft>(),
        studioDraftVersion: integer("studio_draft_version").notNull().default(0),
        // A random secret in the public link; null means the clip is not shared.
        shareToken: text("share_token").unique(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        // One clip per slot: a second run of the selection can never duplicate the video's clips.
        // Its leading column also serves every "clips of this video" query.
        uniqueIndex("clips_video_id_position_idx").on(table.videoId, table.position),
        check(
            "clips_output_bytes_positive",
            sql`${table.outputBytes} is null or ${table.outputBytes} >= 0`,
        ),
        check("clips_start_seconds_positive", sql`${table.startSeconds} >= 0`),
        check("clips_range_ordered", sql`${table.endSeconds} > ${table.startSeconds}`),
        check(
            "clips_score_range",
            sql`${table.score} between ${sql.raw(String(MIN_SCORE))} and ${sql.raw(String(MAX_SCORE))}`,
        ),
        check("clips_studio_draft_version_positive", sql`${table.studioDraftVersion} >= 0`),
    ],
);

export type Clip = typeof clips.$inferSelect;
