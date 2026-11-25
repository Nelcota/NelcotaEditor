import { z } from "zod";
import { pickTurnstileAllowedHostnames } from "#/modules/auth/server/turnstile-allowed-hostnames";
import { getEnvironment } from "#/shared/server/env.server";
import { logger } from "#/shared/server/logger.server";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VERIFY_TIMEOUT_MILLISECONDS = 10_000;

const siteverifyResponseSchema = z.object({
    success: z.boolean(),
    hostname: z.string().optional(),
});

/**
 * The adapter the public contact form checks its Turnstile token through; tests replace it.
 * Without a secret (development and tests) every token passes; production refuses to start
 * without one, in the auth module.
 */
export async function verifyTurnstileToken(token: string | null): Promise<boolean> {
    const environment = getEnvironment();
    const secretKey = environment.TURNSTILE_SECRET_KEY;

    if (secretKey === undefined) {
        return true;
    }

    if (token === null || token.trim().length === 0) {
        return false;
    }

    const response = await fetch(SITEVERIFY_URL, {
        method: "POST",
        body: new URLSearchParams({ secret: secretKey, response: token }),
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MILLISECONDS),
    });
    const result = siteverifyResponseSchema.safeParse(await response.json());

    if (result.success === false) {
        logger.warn({ status: response.status }, "Turnstile answered in an unknown shape");
        return false;
    }

    const allowedHostnames = pickTurnstileAllowedHostnames(secretKey, environment.BETTER_AUTH_URL);
    const hostname = result.data.hostname ?? "";

    if (allowedHostnames.length > 0 && allowedHostnames.includes(hostname) === false) {
        return false;
    }

    return result.data.success;
}
