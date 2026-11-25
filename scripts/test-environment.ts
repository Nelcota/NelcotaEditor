import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";

export const TEST_ENV_FILE = ".env.test";

/**
 * Bun, Vite and dotenv also read .env, and a key missing from .env.test would come from there:
 * a test could write to the real R2 bucket, send an email or spend DeepSeek credit. Every key that
 * reaches an outside service is set here, so the developer's own values never apply.
 */
export const EXTERNAL_SERVICES_OFF = {
    STORAGE_DRIVER: "disk",
    R2_ACCOUNT_ID: "",
    R2_ACCESS_KEY_ID: "",
    R2_SECRET_ACCESS_KEY: "",
    R2_BUCKET: "",
    RESEND_API_KEY: "",
    DEEPSEEK_API_KEY: "",
    TURNSTILE_SITE_KEY: "",
    TURNSTILE_SECRET_KEY: "",
    YOUTUBE_COOKIES_BASE64: "",
} as const satisfies Record<string, string>;

/** .env.test alone, never merged with .env, with every outside service off. */
export function readTestEnvironment(): Record<string, string> {
    if (existsSync(TEST_ENV_FILE) === false) {
        return { ...EXTERNAL_SERVICES_OFF };
    }

    return { ...parse(readFileSync(TEST_ENV_FILE)), ...EXTERNAL_SERVICES_OFF };
}
