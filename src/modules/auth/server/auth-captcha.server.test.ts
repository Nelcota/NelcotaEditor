import { describe, expect, it } from "vitest";
import { buildCaptchaPlugins } from "#/modules/auth/server/auth-captcha.server";
import { InvalidEnvironmentError, parseEnvironment } from "#/shared/server/env.server";

const BASE_VARIABLES = {
    DATABASE_URL: "postgres://test:test@127.0.0.1:1/test",
    STORAGE_DIR: "test-storage",
    WHISPER_URL: "http://127.0.0.1:1",
    WHISPER_MODEL: "test-model",
    BETTER_AUTH_URL: "https://cortes.example.com",
};

const TURNSTILE_KEYS = {
    TURNSTILE_SITE_KEY: "site-key",
    TURNSTILE_SECRET_KEY: "secret-key",
};

describe("buildCaptchaPlugins", () => {
    it("refuses to build auth in production without the Turnstile keys", () => {
        const environment = parseEnvironment({ ...BASE_VARIABLES, NODE_ENV: "production" });

        expect(() => buildCaptchaPlugins(environment)).toThrow(InvalidEnvironmentError);
    });

    it("builds the Turnstile check in production with both keys", () => {
        const environment = parseEnvironment({
            ...BASE_VARIABLES,
            ...TURNSTILE_KEYS,
            NODE_ENV: "production",
        });

        expect(buildCaptchaPlugins(environment)).toHaveLength(1);
    });

    it("skips the check in development without the keys", () => {
        const environment = parseEnvironment(BASE_VARIABLES);

        expect(buildCaptchaPlugins(environment)).toEqual([]);
    });
});
