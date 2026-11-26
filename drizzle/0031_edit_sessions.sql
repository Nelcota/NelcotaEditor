CREATE TABLE "edit_session_notes" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"session_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "edit_session_notes_body_length" CHECK (char_length("edit_session_notes"."body") between 1 and 1000)
);
--> statement-breakpoint
CREATE TABLE "edit_session_videos" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"session_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "edit_session_videos_video_id_unique" UNIQUE("video_id")
);
--> statement-breakpoint
CREATE TABLE "edit_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"format" text NOT NULL,
	"number" integer NOT NULL,
	"status" text DEFAULT 'collecting' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "edit_sessions_user_format_number_unique" UNIQUE("user_id","format","number"),
	CONSTRAINT "edit_sessions_status_known" CHECK ("edit_sessions"."status" in ('collecting', 'queued')),
	CONSTRAINT "edit_sessions_format_known" CHECK ("edit_sessions"."format" in ('split-screen')),
	CONSTRAINT "edit_sessions_number_positive" CHECK ("edit_sessions"."number" >= 1)
);
--> statement-breakpoint
ALTER TABLE "edits" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "edit_session_notes" ADD CONSTRAINT "edit_session_notes_session_id_edit_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."edit_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_session_videos" ADD CONSTRAINT "edit_session_videos_session_id_edit_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."edit_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_session_videos" ADD CONSTRAINT "edit_session_videos_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_sessions" ADD CONSTRAINT "edit_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "edit_session_notes_session_id_idx" ON "edit_session_notes" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "edit_session_videos_session_id_idx" ON "edit_session_videos" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "edit_sessions_user_id_created_at_idx" ON "edit_sessions" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "edits" ADD CONSTRAINT "edits_session_id_edit_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."edit_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "edits_session_id_idx" ON "edits" USING btree ("session_id");