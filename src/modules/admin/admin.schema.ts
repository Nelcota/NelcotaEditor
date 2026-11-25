import { sql } from "drizzle-orm";
import { check, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { AppSwitchKey } from "#/modules/app-switches/model/app-switch";
import type { ADMIN_ROLE, USER_ROLE } from "#/modules/auth/auth.schema";

export const ADMIN_AUDIT_ACTIONS = [
    "ban-user",
    "unban-user",
    "set-role",
    "revoke-sessions",
    "delete-user",
    "start-impersonation",
    "stop-impersonation",
    "cancel-video",
    "delete-video",
    "set-app-switch",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

/** Never the ban reason itself or any other free text: only what tells the actions apart. */
export type AdminAuditDetails = {
    readonly role?: typeof ADMIN_ROLE | typeof USER_ROLE;
    readonly banReasonLength?: number;
    readonly switchKey?: AppSwitchKey;
    readonly isEnabled?: boolean;
};

/** Constant values written into the CHECK; never user input. */
const ADMIN_AUDIT_ACTION_LIST = ADMIN_AUDIT_ACTIONS.map((action) => `'${action}'`).join(", ");

export const adminAuditLog = pgTable(
    "admin_audit_log",
    {
        // Only new rows get UUID v7 ids; existing rows keep theirs.
        id: uuid("id")
            .primaryKey()
            .default(sql`uuidv7()`),
        // Plain ids without foreign keys: the record must outlive the admin, account and video it
        // names.
        adminId: text("admin_id").notNull(),
        action: text("action", { enum: ADMIN_AUDIT_ACTIONS }).notNull(),
        targetUserId: text("target_user_id"),
        videoId: uuid("video_id"),
        details: jsonb("details").$type<AdminAuditDetails>(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        check(
            "admin_audit_log_action_known",
            sql`${table.action} in (${sql.raw(ADMIN_AUDIT_ACTION_LIST)})`,
        ),
    ],
);
