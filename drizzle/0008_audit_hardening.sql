DROP INDEX IF EXISTS "videos_user_id_idx";--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "processing_started_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "videos_user_id_created_at_idx" ON "videos" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
UPDATE "videos" SET "title" = left("title", 200) WHERE char_length("title") > 200;--> statement-breakpoint
ALTER TABLE "videos" DROP CONSTRAINT IF EXISTS "videos_requested_clip_count_range";--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_requested_clip_count_range" CHECK ("videos"."requested_clip_count" between 1 and 10);--> statement-breakpoint
ALTER TABLE "videos" DROP CONSTRAINT IF EXISTS "videos_progress_percent_range";--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_progress_percent_range" CHECK ("videos"."progress_percent" between 0 and 100);--> statement-breakpoint
ALTER TABLE "videos" DROP CONSTRAINT IF EXISTS "videos_duration_seconds_positive";--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_duration_seconds_positive" CHECK ("videos"."duration_seconds" is null or "videos"."duration_seconds" > 0);--> statement-breakpoint
ALTER TABLE "videos" DROP CONSTRAINT IF EXISTS "videos_title_length";--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_title_length" CHECK (char_length("videos"."title") between 1 and 200);--> statement-breakpoint
ALTER TABLE "clips" DROP CONSTRAINT IF EXISTS "clips_start_seconds_positive";--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_start_seconds_positive" CHECK ("clips"."start_seconds" >= 0);--> statement-breakpoint
ALTER TABLE "clips" DROP CONSTRAINT IF EXISTS "clips_range_ordered";--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_range_ordered" CHECK ("clips"."end_seconds" > "clips"."start_seconds");--> statement-breakpoint
ALTER TABLE "clips" DROP CONSTRAINT IF EXISTS "clips_score_range";--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_score_range" CHECK ("clips"."score" between 1 and 100);--> statement-breakpoint
ALTER TABLE "clips" DROP CONSTRAINT IF EXISTS "clips_studio_draft_version_positive";--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_studio_draft_version_positive" CHECK ("clips"."studio_draft_version" >= 0);--> statement-breakpoint
ALTER TABLE "user_preferences" DROP CONSTRAINT IF EXISTS "user_preferences_default_clip_count_range";--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_default_clip_count_range" CHECK ("user_preferences"."default_clip_count" between 1 and 10);
