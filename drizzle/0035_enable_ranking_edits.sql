ALTER TABLE "edit_sessions" DROP CONSTRAINT "edit_sessions_format_known";--> statement-breakpoint
ALTER TABLE "edits" DROP CONSTRAINT "edits_format_known";--> statement-breakpoint
ALTER TABLE "edit_sessions" ADD CONSTRAINT "edit_sessions_format_known" CHECK ("edit_sessions"."format" in ('split-screen', 'this-or-that', 'generic', 'hacking', 'ranking'));--> statement-breakpoint
ALTER TABLE "edits" ADD CONSTRAINT "edits_format_known" CHECK ("edits"."format" in ('split-screen', 'this-or-that', 'generic', 'hacking', 'ranking'));