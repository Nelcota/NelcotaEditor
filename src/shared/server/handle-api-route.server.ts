import { HTTP_INTERNAL_SERVER_ERROR, errorResponse } from "#/shared/server/http-response";
import { logger } from "#/shared/server/logger.server";
import { UserFacingError, toUserMessage } from "#/shared/server/user-facing-error";

/**
 * API routes run outside the server function middleware that hides internal errors, so each one
 * goes through here: the error is logged with the route pattern (never the URL, which can carry a
 * share token) and the browser gets a generic message, or the UserFacingError's own message.
 */
export async function handleApiRoute(
    routeName: string,
    handler: () => Promise<Response>,
): Promise<Response> {
    try {
        return await handler();
    } catch (error) {
        if (error instanceof UserFacingError) {
            return errorResponse(HTTP_INTERNAL_SERVER_ERROR, error.message);
        }

        logger.error("API route failed", { route: routeName, error });
        return errorResponse(HTTP_INTERNAL_SERVER_ERROR, toUserMessage(error));
    }
}
