import type { SessionUser } from "#/modules/auth/model/session-user";
import { getFreshSessionUser } from "#/modules/auth/server/get-session-user.server";
import { logger } from "#/shared/server/logger.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

/**
 * Skips the session cookie cache, so an admin whose role was removed loses access on the next
 * request, not five minutes later.
 */
export async function requireAdmin(headers: Headers): Promise<SessionUser> {
    const user = await getFreshSessionUser(headers);

    if (user === null) {
        throw new UserFacingError("Sua sessão expirou. Entre novamente.");
    }

    if (user.isAdmin === false) {
        logger.warn({ userId: user.id }, "Non-admin called an admin function");
        throw new UserFacingError("Esta área é só para administradores.");
    }

    return user;
}
