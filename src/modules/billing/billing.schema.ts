import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "#/modules/auth/auth.schema";
import { SUBSCRIPTION_STATUSES } from "#/modules/billing/model/subscription-plan";

/** Constant values written into the CHECK; never user input. */
const STATUS_LIST = SUBSCRIPTION_STATUSES.map((status) => `'${status}'`).join(", ");

/** One row per person: their Editor Oculto subscription, kept in step by Asaas webhooks. */
export const subscriptions = pgTable(
    "subscriptions",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`uuidv7()`),
        userId: text("user_id")
            .notNull()
            .unique()
            .references(() => user.id, { onDelete: "cascade" }),
        /** The Asaas checkout the person was last sent to; a new one replaces it. */
        checkoutId: text("checkout_id").notNull().unique(),
        checkoutExpiresAt: timestamp("checkout_expires_at", { withTimezone: true }).notNull(),
        /** Set once Asaas creates the subscription behind the paid checkout. */
        asaasSubscriptionId: text("asaas_subscription_id").unique(),
        status: text("status", { enum: SUBSCRIPTION_STATUSES }).notNull().default("pending"),
        paidUntil: timestamp("paid_until", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        check("subscriptions_status_known", sql`${table.status} in (${sql.raw(STATUS_LIST)})`),
    ],
);

/** Asaas delivers a webhook at least once; each event id is applied only the first time. */
export const asaasWebhookEvents = pgTable("asaas_webhook_events", {
    id: text("id").primaryKey(),
    event: text("event").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});
