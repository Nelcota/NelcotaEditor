-- The duration is unknown until the source is probed again.
UPDATE "videos" SET "duration_seconds" = NULL WHERE "duration_seconds" >= 'Infinity'::double precision;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_duration_seconds_finite" CHECK ("videos"."duration_seconds" is null or "videos"."duration_seconds" < 'Infinity'::double precision);--> statement-breakpoint
-- Retain old cuts and their files. The Studio refuses an edit when its stored times are invalid.
ALTER TABLE "clips" ADD CONSTRAINT "clips_times_finite" CHECK ("clips"."start_seconds" < 'Infinity'::double precision and "clips"."end_seconds" < 'Infinity'::double precision) NOT VALID;
