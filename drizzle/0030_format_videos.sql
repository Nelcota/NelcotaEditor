ALTER TABLE "videos" DROP CONSTRAINT "videos_requested_clip_count_range";--> statement-breakpoint
ALTER TABLE "video_uploads" DROP CONSTRAINT "video_uploads_requested_clip_count_range";--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "purpose" text DEFAULT 'clips' NOT NULL;--> statement-breakpoint
ALTER TABLE "video_uploads" ADD COLUMN "purpose" text DEFAULT 'clips' NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_purpose_known" CHECK ("videos"."purpose" in ('clips', 'format'));--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_requested_clip_count_range" CHECK (("videos"."purpose" = 'format' and "videos"."requested_clip_count" = 0) or ("videos"."purpose" = 'clips' and "videos"."requested_clip_count" between 1 and 10));--> statement-breakpoint
ALTER TABLE "video_uploads" ADD CONSTRAINT "video_uploads_purpose_known" CHECK ("video_uploads"."purpose" in ('clips', 'format'));--> statement-breakpoint
ALTER TABLE "video_uploads" ADD CONSTRAINT "video_uploads_requested_clip_count_range" CHECK (("video_uploads"."purpose" = 'format' and "video_uploads"."requested_clip_count" = 0) or ("video_uploads"."purpose" = 'clips' and "video_uploads"."requested_clip_count" between 1 and 10));