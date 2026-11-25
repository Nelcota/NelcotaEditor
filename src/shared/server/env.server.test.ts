import { describe, expect, it } from "vitest";
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

describe("parseEnvironment", () => {
    // The worker parses this schema in production and never holds the keys; auth requires them.
    it("accepts production without the Turnstile keys", () => {
        const variables = { ...BASE_VARIABLES, NODE_ENV: "production" };

        const environment = parseEnvironment(variables);

        expect(environment.TURNSTILE_SECRET_KEY).toBeUndefined();
    });

    it("accepts production with both Turnstile keys", () => {
        const variables = { ...BASE_VARIABLES, ...TURNSTILE_KEYS, NODE_ENV: "production" };

        const environment = parseEnvironment(variables);

        expect(environment.TURNSTILE_SECRET_KEY).toBe("secret-key");
    });

    it("accepts development without the Turnstile keys", () => {
        const environment = parseEnvironment(BASE_VARIABLES);

        expect(environment.TURNSTILE_SITE_KEY).toBeUndefined();
    });

    it("rejects only one Turnstile key", () => {
        const variables = { ...BASE_VARIABLES, TURNSTILE_SITE_KEY: "site-key" };

        expect(() => parseEnvironment(variables)).toThrow(InvalidEnvironmentError);
        expect(() => parseEnvironment(variables)).toThrow(/TURNSTILE_SECRET_KEY/);
    });
});
