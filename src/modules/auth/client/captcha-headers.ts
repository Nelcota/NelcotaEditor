/** Better Auth's captcha plugin reads the Turnstile token from this header. */
const CAPTCHA_RESPONSE_HEADER = "x-captcha-response";

export function buildCaptchaHeaders(token: string | null): Record<string, string> {
    if (token === null) {
        return {};
    }

    return { [CAPTCHA_RESPONSE_HEADER]: token };
}
