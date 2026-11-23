import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

/** Never the ban reason itself or any other free text: only what tells the actions apart. */
export type AdminAuditDetails = {
    readonly role?: typeof ADMIN_ROLE | typeof USER_ROLE;
    readonly banReasonLength?: number;
};

export const adminAuditLog = pgTable("admin_audit_log", {
    id: uuid("id").primaryKey().defaultRandom(),
    // Plain ids without foreign keys: the record must outlive the admin, account and video it names.
    adminId: text("admin_id").notNull(),
    action: text("action", { enum: ADMIN_AUDIT_ACTIONS }).notNull(),
    targetUserId: text("target_user_id"),
    videoId: uuid("video_id"),
    details: jsonb("details").$type<AdminAuditDetails>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
