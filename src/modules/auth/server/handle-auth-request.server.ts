import { auth } from "#/modules/auth/server/auth.server";
import { AuthBodyTooLargeError, prepareAuthRequest } from "#/modules/auth/server/client-ip.server";
import { HTTP_PAYLOAD_TOO_LARGE, errorResponse } from "#/shared/server/http-response";

/** /api/auth/*: Better Auth, with the client IP its rate limit keys on and a capped body. */
export async function handleAuthRequest(request: Request): Promise<Response> {
    try {
        return await auth.handler(await prepareAuthRequest(request));
    } catch (error) {
        if (error instanceof AuthBodyTooLargeError) {
            return errorResponse(HTTP_PAYLOAD_TOO_LARGE, "Envio grande demais.");
        }

        throw error;
    }
}
