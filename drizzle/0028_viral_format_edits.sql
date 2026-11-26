CREATE TABLE "edits" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"video_id" uuid NOT NULL,
	"title" text NOT NULL,
	"format" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"plan" jsonb NOT NULL,
	"output_path" text,
	"output_bytes" bigint,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "edits_status_known" CHECK ("edits"."status" in ('queued', 'rendering', 'done', 'failed')),
	CONSTRAINT "edits_format_known" CHECK ("edits"."format" in ('split-screen')),
	CONSTRAINT "edits_title_length" CHECK (char_length("edits"."title") between 1 and 120),
	CONSTRAINT "edits_done_has_output" CHECK ("edits"."status" <> 'done' or "edits"."output_path" is not null)
);
--> statement-breakpoint
ALTER TABLE "edits" ADD CONSTRAINT "edits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edits" ADD CONSTRAINT "edits_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "edits_user_id_created_at_idx" ON "edits" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "edits_video_id_idx" ON "edits" USING btree ("video_id");