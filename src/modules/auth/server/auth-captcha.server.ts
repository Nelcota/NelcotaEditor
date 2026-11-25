import { captcha } from "better-auth/plugins";
import { pickTurnstileAllowedHostnames } from "#/modules/auth/server/turnstile-allowed-hostnames";
import { InvalidEnvironmentError } from "#/shared/server/env.server";
import type { Environment } from "#/shared/server/env.server";

const PRODUCTION = "production";

/**
 * Bots create accounts, guess passwords and send email to strangers through these; the browser
 * sends a Turnstile token.
 */
const CAPTCHA_ENDPOINTS = ["/sign-up/email", "/sign-in/email", "/request-password-reset"];

/**
 * Cloudflare Turnstile when its keys are configured; without them auth works with no check, which
 * only development and tests may do. Checked here, not in the environment schema, because only the
 * web server builds auth; the worker shares the schema and never holds these keys.
 *
 * @throws {InvalidEnvironmentError} In production without the Turnstile keys.
 */
export function buildCaptchaPlugins(environment: Environment): Array<ReturnType<typeof captcha>> {
    const secretKey = environment.TURNSTILE_SECRET_KEY;
    const authUrl = environment.BETTER_AUTH_URL;

    if (secretKey === undefined && environment.NODE_ENV === PRODUCTION) {
        throw new InvalidEnvironmentError(["TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"]);
    }

    if (secretKey === undefined) {
        return [];
    }

    return [
        captcha({
            provider: "cloudflare-turnstile",
            secretKey,
            endpoints: CAPTCHA_ENDPOINTS,
            allowedHostnames: pickTurnstileAllowedHostnames(secretKey, authUrl),
        }),
    ];
}
