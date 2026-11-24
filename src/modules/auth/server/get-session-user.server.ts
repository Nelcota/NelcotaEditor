import { ADMIN_ROLE } from "#/modules/auth/auth.schema";
import type { SessionUser } from "#/modules/auth/model/session-user";
import { auth } from "#/modules/auth/server/auth.server";

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

function toSessionUser(authSession: AuthSession): SessionUser | null {
    if (authSession === null) {
        return null;
    }

    const sessionUser = authSession.user;
    const impersonatedBy = authSession.session.impersonatedBy;

    return {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        image: sessionUser.image ?? null,
        isAdmin: sessionUser.role === ADMIN_ROLE,
        isImpersonated: impersonatedBy !== null && impersonatedBy !== undefined,
    };
}

/**
 * Reads the signed-in user from the request cookies (or the 5-minute signed cookie cache).
 * Never trust a user id sent by the client.
 */
export async function getSessionUser(headers: Headers): Promise<SessionUser | null> {
    const authSession = await auth.api.getSession({ headers });

    return toSessionUser(authSession);
}

/**
 * Same as getSessionUser, but skips the cookie cache: the name and photo are written straight to
 * the database, and a session ended on another device must stop the app on the next navigation.
 */
export async function getFreshSessionUser(headers: Headers): Promise<SessionUser | null> {
    const authSession = await auth.api.getSession({ headers, query: { disableCookieCache: true } });

    return toSessionUser(authSession);
}
