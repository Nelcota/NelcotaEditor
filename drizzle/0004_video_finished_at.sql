ALTER TABLE "videos" ADD COLUMN "finished_at" timestamp;--> statement-breakpoint
-- Best guess for videos that finished before the column existed.
UPDATE "videos" SET "finished_at" = "updated_at" WHERE "status" IN ('done', 'failed', 'cancelled');
