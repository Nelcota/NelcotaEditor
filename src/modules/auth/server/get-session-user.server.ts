import type { SessionUser } from "#/modules/auth/session-user";
import { auth } from "#/modules/auth/server/auth.server";

/** Reads the signed-in user from the request cookies. Never trust a user id sent by the client. */
export async function getSessionUser(headers: Headers): Promise<SessionUser | null> {
    const authSession = await auth.api.getSession({ headers });

    if (authSession === null) {
        return null;
    }

    const sessionUser = authSession.user;

    return {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        image: sessionUser.image ?? null,
    };
}
