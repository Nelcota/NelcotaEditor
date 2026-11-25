import { adminUserIdInputSchema } from "#/modules/admin/model/admin-search";
import { getFreshSessionUser } from "#/modules/auth/server/get-session-user.server";
import { respondWithUserAvatar } from "#/modules/auth/server/avatar-routes.server";
import { logger } from "#/shared/server/logger.server";
import { HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from "#/shared/server/http-response";

/** GET /api/admin/users/:userId/avatar — any account's uploaded photo, for admins only. */
export async function serveAdminUserAvatar(request: Request, userId: string): Promise<Response> {
    const viewer = await getFreshSessionUser(request.headers);

    if (viewer === null) {
        return new Response(null, { status: HTTP_UNAUTHORIZED });
    }

    if (viewer.isAdmin === false) {
        logger.warn({ userId: viewer.id }, "Non-admin asked for another account's photo");
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    const result = adminUserIdInputSchema.safeParse({ userId });

    if (result.success === false) {
        return new Response(null, { status: HTTP_NOT_FOUND });
    }

    return respondWithUserAvatar(request, result.data.userId, "admin");
}
