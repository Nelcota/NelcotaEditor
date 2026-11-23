import { z } from "zod";
import type { AdminAuditAction, AdminAuditDetails } from "#/modules/admin/admin-audit.schema";

export type AdminAuditEntry = {
    readonly action: AdminAuditAction;
    readonly adminId: string;
    readonly targetUserId: string | null;
    readonly videoId: string | null;
    readonly details: AdminAuditDetails | null;
};

/** The reason may name the person or quote them, so only its length is kept. */
export function toBanDetails(reason: string): AdminAuditDetails {
    return { banReasonLength: Array.from(reason).length };
}

const impersonatedSessionSchema = z.object({
    userId: z.string().min(1),
    impersonatedBy: z.string().min(1),
});

const STOP_IMPERSONATING_PATH = "/admin/stop-impersonating";

/** A session row from Better Auth; only a visit as a customer carries `impersonatedBy`. */
function toImpersonationEntry(
    action: "start-impersonation" | "stop-impersonation",
    session: Readonly<Record<string, unknown>>,
): AdminAuditEntry | null {
    const result = impersonatedSessionSchema.safeParse(session);

    if (result.success === false) {
        return null;
    }

    const visit = result.data;

    return {
        action,
        adminId: visit.impersonatedBy,
        targetUserId: visit.userId,
        videoId: null,
        details: null,
    };
}

/** For a session Better Auth just created: only a visit as a customer is recorded. */
export function toImpersonationStartEntry(
    session: Readonly<Record<string, unknown>>,
): AdminAuditEntry | null {
    return toImpersonationEntry("start-impersonation", session);
}

/**
 * For a session Better Auth just deleted. A visit's session is also deleted when it expires or the
 * account is blocked; only the "back to my account" button counts as the admin ending it.
 */
export function toImpersonationStopEntry(
    session: Readonly<Record<string, unknown>>,
    endpointPath: string | undefined,
): AdminAuditEntry | null {
    if (endpointPath !== STOP_IMPERSONATING_PATH) {
        return null;
    }

    return toImpersonationEntry("stop-impersonation", session);
}
