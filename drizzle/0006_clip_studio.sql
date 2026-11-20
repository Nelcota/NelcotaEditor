CREATE TYPE "public"."clip_caption_color" AS ENUM('yellow', 'green', 'red', 'blue', 'purple', 'white');--> statement-breakpoint
CREATE TYPE "public"."clip_caption_position" AS ENUM('top', 'middle', 'bottom');--> statement-breakpoint
CREATE TYPE "public"."clip_caption_size" AS ENUM('small', 'medium', 'large');--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "caption_color" "clip_caption_color" DEFAULT 'yellow' NOT NULL;--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "caption_size" "clip_caption_size" DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "caption_position" "clip_caption_position" DEFAULT 'bottom' NOT NULL;--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "caption_cues" jsonb;--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "studio_draft" jsonb;--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "studio_draft_version" integer DEFAULT 0 NOT NULL;