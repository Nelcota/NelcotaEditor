import { getSessionUser } from "#/modules/auth/server/get-session-user.server";
import { UserFacingError } from "#/shared/server/user-facing-error";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/** Every server function that touches user data goes through this middleware. */
export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
    const request = getRequest();
    const user = await getSessionUser(request.headers);

    if (user === null) {
        throw new UserFacingError("Sua sessão expirou. Entre novamente.");
    }

    return next({ context: { user } });
});
