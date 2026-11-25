// Cloudflare's documented testing secrets (always pass, always fail, token already spent). They
// accept the dummy token from any page and always report example.com as the hostname.
const TESTING_SECRET_KEY_PATTERN = /^[123]x0{31}AA$/;

/**
 * The hostnames a Turnstile token must have been solved on: the app's own, so a token solved on
 * another site with the same key does not count. Testing secrets skip the check, since their
 * answer never names the app; production keys never match the pattern.
 */
export function pickTurnstileAllowedHostnames(
    secretKey: string,
    appUrl: string | undefined,
): Array<string> {
    if (TESTING_SECRET_KEY_PATTERN.test(secretKey) === true) {
        return [];
    }

    if (appUrl === undefined) {
        return [];
    }

    return [new URL(appUrl).hostname];
}
