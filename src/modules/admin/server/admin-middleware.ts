import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getFreshSessionUser } from "#/modules/auth/server/get-session-user.server";
import { logger } from "#/shared/server/logger.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

/**
 * Every admin server function goes through this. It skips the session cookie cache, so an admin
 * whose role was removed loses access on the next request, not five minutes later.
 */
export const adminMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
    const request = getRequest();
    const user = await getFreshSessionUser(request.headers);

    if (user === null) {
        throw new UserFacingError("Sua sessão expirou. Entre novamente.");
    }

    if (user.isAdmin === false) {
        logger.warn({ userId: user.id }, "Non-admin called an admin function");
        throw new UserFacingError("Esta área é só para administradores.");
    }

    return next({ context: { admin: user, headers: request.headers } });
});
