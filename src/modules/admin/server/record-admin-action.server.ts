import { db } from "#/db/database.server";
import { adminAuditLog } from "#/modules/admin/admin.schema";
import type { AdminAuditEntry } from "#/modules/admin/server/admin-audit-entry.server";
import {
    toImpersonationStartEntry,
    toImpersonationStopEntry,
} from "#/modules/admin/server/admin-audit-entry.server";
import { logger } from "#/shared/server/logger.server";

/**
 * Called after the action succeeded. The log line goes first, so the action stays on record even
 * when the insert fails; that failure still reaches the caller.
 */
export async function recordAdminAction(entry: AdminAuditEntry): Promise<void> {
    logger.info(entry, "Admin action");
    await db.insert(adminAuditLog).values(entry);
}

/** Better Auth's session create hook. */
export async function recordImpersonationStart(
    session: Readonly<Record<string, unknown>>,
): Promise<void> {
    const entry = toImpersonationStartEntry(session);

    if (entry === null) {
        return;
    }

    await recordAdminAction(entry);
}

/** Better Auth's session delete hook. */
export async function recordImpersonationStop(
    session: Readonly<Record<string, unknown>>,
    endpointContext: { path?: string } | null,
): Promise<void> {
    if (endpointContext === null) {
        return;
    }

    const entry = toImpersonationStopEntry(session, endpointContext.path);

    if (entry === null) {
        return;
    }

    await recordAdminAction(entry);
}
