CREATE TABLE "asaas_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"checkout_id" text NOT NULL,
	"checkout_expires_at" timestamp with time zone NOT NULL,
	"asaas_subscription_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "subscriptions_checkout_id_unique" UNIQUE("checkout_id"),
	CONSTRAINT "subscriptions_asaas_subscription_id_unique" UNIQUE("asaas_subscription_id"),
	CONSTRAINT "subscriptions_status_known" CHECK ("subscriptions"."status" in ('pending', 'active', 'overdue', 'canceled'))
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;