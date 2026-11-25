import { assertOutsideMaintenance } from "#/modules/app-switches/server/app-switches.server";
import { getFreshSessionUser } from "#/modules/auth/server/get-session-user.server";
import { UserFacingError } from "#/shared/server/user-facing-error";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/**
 * Every server function that touches user data goes through this. It skips the session cookie
 * cache: a ban or account deletion removes the sessions, and with the cache a banned or deleted
 * user would keep calling server functions for up to five minutes. The cost is one indexed session
 * lookup per call; video, caption and thumbnail range requests, which come in bursts and only
 * read, keep the cache. In maintenance only admins get through; media requests keep working,
 * since without the app's pages they only replay a person's own files.
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
    const request = getRequest();
    const user = await getFreshSessionUser(request.headers);

    if (user === null) {
        throw new UserFacingError("Sua sessão expirou. Entre novamente.");
    }

    await assertOutsideMaintenance(user.isAdmin);

    return next({ context: { user } });
});
