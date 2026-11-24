import { auth } from "#/modules/auth/server/auth.server";
import { AuthBodyTooLargeError, prepareAuthRequest } from "#/modules/auth/server/client-ip.server";
import { logAuthSecurityEvent } from "#/modules/auth/server/log-auth-security-event.server";
import { HTTP_PAYLOAD_TOO_LARGE, errorResponse } from "#/shared/server/http-response";

/** /api/auth/*: Better Auth, with the client IP its rate limit keys on and a capped body. */
export async function handleAuthRequest(request: Request): Promise<Response> {
    try {
        const response = await auth.handler(await prepareAuthRequest(request));
        logAuthSecurityEvent(request, response);
        return response;
    } catch (error) {
        if (error instanceof AuthBodyTooLargeError) {
            return errorResponse(HTTP_PAYLOAD_TOO_LARGE, "Envio grande demais.");
        }

        throw error;
    }
}
