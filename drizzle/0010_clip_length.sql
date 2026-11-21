CREATE TYPE "public"."clip_length" AS ENUM('short', 'minute', 'free');--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "clip_length" "clip_length" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "default_clip_length" "clip_length" DEFAULT 'free' NOT NULL;