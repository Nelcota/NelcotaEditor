import { isNotFound, isRedirect } from "@tanstack/react-router";
import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { buildContentSecurityPolicy } from "#/shared/server/content-security-policy";
import { getStorageMediaOrigin } from "#/shared/server/file-storage/storage-media-origin.server";
import { logger, withLogContext } from "#/shared/server/logger.server";
import { SECURITY_HEADERS, withNoStoreByDefault } from "#/shared/server/security-headers";
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

/**
 * Every log line of a request carries its id, and the response says it, so a report from a person
 * leads to their lines. Always made here: a client could send any id it likes.
 */
const requestIdMiddleware = createMiddleware({ type: "request" }).server(async ({ next }) => {
    const requestId = crypto.randomUUID();
    setResponseHeader("X-Request-Id", requestId);

    return await withLogContext({ requestId }, async () => await next());
});

/** A fresh random nonce per response; dashes dropped so it is plain base16. */
function createCspNonce(): string {
    return crypto.randomUUID().replaceAll("-", "");
}

/** The nonce travels in the request context so getRouter can stamp it on the SSR scripts. */
const securityHeadersMiddleware = createMiddleware({ type: "request" }).server(async ({ next }) => {
    const cspNonce = createCspNonce();
    const policy = buildContentSecurityPolicy({
        nonce: cspNonce,
        isDevelopment: import.meta.env.DEV,
        storageMediaOrigin: getStorageMediaOrigin(),
    });

    for (const [name, value] of SECURITY_HEADERS) {
        setResponseHeader(name, value);
    }

    setResponseHeader("Content-Security-Policy", policy);
    const result = await next({ context: { cspNonce } });
    return { ...result, response: withNoStoreByDefault(result.response) };
});

/** Server function errors reach the browser; only messages meant for users get through. */
const hideInternalErrorsMiddleware = createMiddleware({ type: "function" }).server(
    async ({ next, serverFnMeta }) => {
        try {
            return await next();
        } catch (error) {
            if (isRedirect(error) || isNotFound(error)) {
                throw error;
            }

            if (error instanceof UserFacingError) {
                throw toPublicUserFacingError(error);
            }

            // Only the function's name: its input may hold personal data.
            logger.error(
                {
                    serverFunction: serverFnMeta.name,
                    serverFunctionId: serverFnMeta.id,
                    error,
                },
                "Server function failed",
            );
            throw toPublicError(error);
        }
    },
);

/** Its `cause` would be serialized to the browser, so only the message travels. */
function toPublicUserFacingError(error: UserFacingError): UserFacingError {
    return new UserFacingError(error.message);
}

/**
 * The original error is logged above but deliberately not attached as `cause`:
 * it would be serialized to the browser and leak internal details.
 */
function toPublicError(error: unknown): Error {
    return new Error(toUserMessage(error));
}

export const startInstance = createStart(() => ({
    requestMiddleware: [requestIdMiddleware, csrfMiddleware, securityHeadersMiddleware],
    functionMiddleware: [hideInternalErrorsMiddleware],
}));
