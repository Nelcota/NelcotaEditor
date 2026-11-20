ALTER TYPE "public"."video_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "cancel_requested" boolean DEFAULT false NOT NULL;