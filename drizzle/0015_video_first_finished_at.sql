ALTER TABLE "videos" ADD COLUMN "first_finished_at" timestamp with time zone;--> statement-breakpoint
-- Backfill only done videos never run again: their run started with the video, so finished_at is
-- still the first finish. A retry or Studio render moved both columns, so those stay null and out of
-- the average, like videos from before processing_started_at existed.
UPDATE "videos" SET "first_finished_at" = "finished_at" WHERE "status" = 'done' AND "finished_at" IS NOT NULL AND "processing_started_at" < "created_at" + interval '1 minute';
