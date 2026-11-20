import { isNotFound, isRedirect } from "@tanstack/react-router";
import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { UserFacingError, toUserMessage } from "#/shared/server/user-facing-error";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Server functions and the upload/avatar routes act on the signed-in user's cookie, so a page on
 * another site must not be able to call them. Page loads stay open: typing the URL or following a
 * link from elsewhere is not same-origin, and those requests change nothing.
 */
const csrfMiddleware = createCsrfMiddleware({
    filter: (context) =>
        context.handlerType === "serverFn" || SAFE_METHODS.has(context.request.method) === false,
});

/** Server function errors reach the browser; only messages meant for users get through. */
const hideInternalErrorsMiddleware = createMiddleware({ type: "function" }).server(
    async ({ next }) => {
        try {
            return await next();
        } catch (error) {
            if (error instanceof UserFacingError || isRedirect(error) || isNotFound(error)) {
                throw error;
            }

            console.error("Server function failed", error);
            throw toPublicError(error);
        }
    },
);

/**
 * The original error is logged above but deliberately not attached as `cause`:
 * it would be serialized to the browser and leak internal details.
 */
function toPublicError(error: unknown): Error {
    return new Error(toUserMessage(error));
}

export const startInstance = createStart(() => ({
    requestMiddleware: [csrfMiddleware],
    functionMiddleware: [hideInternalErrorsMiddleware],
}));
