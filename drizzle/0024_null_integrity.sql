ALTER TABLE "videos" ADD COLUMN "has_unrecorded_first_finish" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- A later render must not supply the missing first finish of an already completed video.
UPDATE "videos" SET "has_unrecorded_first_finish" = true WHERE "status" = 'done' AND "first_finished_at" IS NULL;--> statement-breakpoint
-- Preserve old transcripts until the worker can regenerate them from the original audio.
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_words_array" CHECK (jsonb_typeof("transcripts"."words") = 'array' and not "transcripts"."words" @> '[null]'::jsonb) NOT VALID;--> statement-breakpoint
-- A cut without an output can be retried through the regular failed-cut flow.
UPDATE "clips" SET "status" = 'failed' WHERE "status" = 'done' AND "output_path" IS NULL;--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_done_has_output" CHECK ("clips"."status" <> 'done' or "clips"."output_path" is not null);--> statement-breakpoint
-- An unusable edit falls back to the transcript. Keep usable cues and their order in mixed arrays.
UPDATE "clips" SET "caption_cues" = NULL WHERE jsonb_typeof("caption_cues") <> 'array';--> statement-breakpoint
UPDATE "clips"
SET "caption_cues" = NULLIF(jsonb_path_query_array("caption_cues", 'strict $[*] ? (@ != null)'), '[]'::jsonb)
WHERE "caption_cues" @> '[null]'::jsonb;--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_caption_cues_array" CHECK ("clips"."caption_cues" is null or (jsonb_typeof("clips"."caption_cues") = 'array' and not "clips"."caption_cues" @> '[null]'::jsonb));
