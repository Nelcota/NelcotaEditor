CREATE TABLE "app_switches" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"key" text NOT NULL,
	"is_enabled" boolean NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_switches_key_unique" UNIQUE("key"),
	CONSTRAINT "app_switches_key_known" CHECK ("app_switches"."key" in ('sign-up', 'youtube-links', 'file-uploads', 'clip-sharing', 'video-processing', 'maintenance-mode'))
);
--> statement-breakpoint
ALTER TABLE "admin_audit_log" DROP CONSTRAINT "admin_audit_log_action_known";--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_action_known" CHECK ("admin_audit_log"."action" in ('ban-user', 'unban-user', 'set-role', 'revoke-sessions', 'delete-user', 'start-impersonation', 'stop-impersonation', 'cancel-video', 'delete-video', 'set-app-switch'));