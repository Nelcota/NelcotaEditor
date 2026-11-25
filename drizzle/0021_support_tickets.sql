CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_kind" text NOT NULL,
	"author_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_messages_author_kind_known" CHECK ("support_messages"."author_kind" in ('customer', 'staff')),
	CONSTRAINT "support_messages_body_length" CHECK (char_length("support_messages"."body") between 1 and 5000)
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "support_tickets_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"user_id" text,
	"contact_email" text,
	"video_id" uuid,
	"subject" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"has_unread_reply" boolean DEFAULT false NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_number_unique" UNIQUE("number"),
	CONSTRAINT "support_tickets_status_known" CHECK ("support_tickets"."status" in ('open', 'answered', 'closed')),
	CONSTRAINT "support_tickets_subject_length" CHECK (char_length("support_tickets"."subject") between 1 and 120),
	CONSTRAINT "support_tickets_has_contact" CHECK ("support_tickets"."user_id" is not null or "support_tickets"."contact_email" is not null)
);
--> statement-breakpoint
ALTER TABLE "admin_audit_log" DROP CONSTRAINT "admin_audit_log_action_known";--> statement-breakpoint
ALTER TABLE "app_switches" DROP CONSTRAINT "app_switches_key_known";--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_messages_ticket_id_created_at_idx" ON "support_messages" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "support_tickets_user_id_last_message_at_idx" ON "support_tickets" USING btree ("user_id","last_message_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "support_tickets_status_last_message_at_idx" ON "support_tickets" USING btree ("status","last_message_at");--> statement-breakpoint
CREATE INDEX "support_tickets_video_id_idx" ON "support_tickets" USING btree ("video_id");--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_action_known" CHECK ("admin_audit_log"."action" in ('ban-user', 'unban-user', 'set-role', 'revoke-sessions', 'delete-user', 'start-impersonation', 'stop-impersonation', 'cancel-video', 'delete-video', 'set-app-switch', 'reply-ticket', 'close-ticket'));--> statement-breakpoint
ALTER TABLE "app_switches" ADD CONSTRAINT "app_switches_key_known" CHECK ("app_switches"."key" in ('sign-up', 'youtube-links', 'file-uploads', 'clip-sharing', 'video-processing', 'support', 'maintenance-mode'));