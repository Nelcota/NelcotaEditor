import { captcha } from "better-auth/plugins";
import { getEnvironment } from "#/shared/server/env.server";

/**
 * Bots create accounts, guess passwords and send email to strangers through these; the browser
 * sends a Turnstile token.
 */
const CAPTCHA_ENDPOINTS = ["/sign-up/email", "/sign-in/email", "/request-password-reset"];

/** Cloudflare Turnstile when its keys are configured; without them auth works with no check. */
export function buildCaptchaPlugins(): Array<ReturnType<typeof captcha>> {
    const environment = getEnvironment();
    const secretKey = environment.TURNSTILE_SECRET_KEY;
    const authUrl = environment.BETTER_AUTH_URL;

    if (secretKey === undefined) {
        return [];
    }

    // A token solved on another site with the same key must not count here.
    const allowedHostnames: Array<string> = [];

    if (authUrl !== undefined) {
        allowedHostnames.push(new URL(authUrl).hostname);
    }

    return [
        captcha({
            provider: "cloudflare-turnstile",
            secretKey,
            endpoints: CAPTCHA_ENDPOINTS,
            allowedHostnames,
        }),
    ];
}
