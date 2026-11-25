import { sql } from "drizzle-orm";
import { boolean, check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { APP_SWITCH_KEYS } from "#/modules/app-switches/model/app-switch";

/** Constant values written into the CHECK; never user input. */
const APP_SWITCH_KEY_LIST = APP_SWITCH_KEYS.map((key) => `'${key}'`).join(", ");

export const appSwitches = pgTable(
    "app_switches",
    {
        id: uuid("id")
            .primaryKey()
            .default(sql`uuidv7()`),
        key: text("key", { enum: APP_SWITCH_KEYS }).notNull().unique(),
        isEnabled: boolean("is_enabled").notNull(),
        // A plain id without a foreign key, like the audit log: the switch outlives the admin.
        updatedBy: text("updated_by").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        check("app_switches_key_known", sql`${table.key} in (${sql.raw(APP_SWITCH_KEY_LIST)})`),
    ],
);
