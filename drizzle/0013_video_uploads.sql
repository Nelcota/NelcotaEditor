CREATE TABLE "video_uploads" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text,
	"source_path" text NOT NULL,
	"declared_bytes" bigint NOT NULL,
	"title" text NOT NULL,
	"requested_clip_count" integer NOT NULL,
	"clip_length" "clip_length" NOT NULL,
	"transcription_language" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_uploads_declared_bytes_positive" CHECK ("video_uploads"."declared_bytes" > 0)
);
--> statement-breakpoint
ALTER TABLE "video_uploads" ADD CONSTRAINT "video_uploads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_uploads_user_id_expires_at_idx" ON "video_uploads" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "video_uploads_expires_at_idx" ON "video_uploads" USING btree ("expires_at");