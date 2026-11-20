CREATE TYPE "public"."clip_aspect_ratio" AS ENUM('vertical', 'square', 'horizontal');--> statement-breakpoint
CREATE TYPE "public"."clip_caption_style" AS ENUM('karaoke', 'classic', 'none');--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "aspect_ratio" "clip_aspect_ratio" DEFAULT 'vertical' NOT NULL;--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "caption_style" "clip_caption_style" DEFAULT 'karaoke' NOT NULL;--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_share_token_unique" UNIQUE("share_token");