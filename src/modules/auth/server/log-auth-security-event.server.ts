import { logger } from "#/shared/server/logger.server";

const AUTH_BASE_PATH = "/api/auth";
const SIGN_IN_PATH = "/sign-in/email";
const HTTP_TOO_MANY_REQUESTS = 429;
const FIRST_CLIENT_ERROR_STATUS = 400;
const FIRST_SERVER_ERROR_STATUS = 500;

/**
 * Better Auth answers a rate-limited request before any of its hooks run, so failed sign-ins and
 * 429s are read here from the response. Only the path and status: the body holds the email.
 */
export function logAuthSecurityEvent(request: Request, response: Response): void {
    const status = response.status;
    const path = new URL(request.url).pathname.replace(AUTH_BASE_PATH, "");

    if (status === HTTP_TOO_MANY_REQUESTS) {
        logger.warn({ path }, "Auth rate limit hit");
        return;
    }

    if (path !== SIGN_IN_PATH) {
        return;
    }

    if (status >= FIRST_CLIENT_ERROR_STATUS && status < FIRST_SERVER_ERROR_STATUS) {
        logger.warn({ status }, "Sign-in failed");
    }
}
