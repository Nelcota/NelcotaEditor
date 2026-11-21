import { auth } from "#/modules/auth/server/auth.server";
import { withDirectClientIp } from "#/modules/auth/server/client-ip.server";

/** /api/auth/*: Better Auth, with the client IP its rate limit keys on. */
export async function handleAuthRequest(request: Request): Promise<Response> {
    return auth.handler(await withDirectClientIp(request));
}
