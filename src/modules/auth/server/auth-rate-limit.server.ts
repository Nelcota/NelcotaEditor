import type { BetterAuthOptions } from "better-auth";

const SECONDS_PER_MINUTE = 60;
const DEFAULT_WINDOW_SECONDS = SECONDS_PER_MINUTE;
const DEFAULT_MAX_REQUESTS = 100;

/**
 * Per client IP and path. Sign-in allows a few typos a minute but makes guessing passwords slow;
 * the rest change or create accounts and are rare for a real person.
 */
const STRICT_RULES = {
    "/sign-in/email": { window: SECONDS_PER_MINUTE, max: 5 },
    "/sign-up/email": { window: 60 * SECONDS_PER_MINUTE, max: 5 },
    "/change-password": { window: 15 * SECONDS_PER_MINUTE, max: 5 },
    "/delete-user": { window: 15 * SECONDS_PER_MINUTE, max: 5 },
    "/request-password-reset": { window: 15 * SECONDS_PER_MINUTE, max: 3 },
    "/reset-password": { window: 15 * SECONDS_PER_MINUTE, max: 5 },
};

/**
 * Always on (Better Auth only enables it in production by default). Memory storage is enough
 * while one web process serves the app; a second instance would need "database" storage.
 */
export const AUTH_RATE_LIMIT: BetterAuthOptions["rateLimit"] = {
    enabled: true,
    storage: "memory",
    window: DEFAULT_WINDOW_SECONDS,
    max: DEFAULT_MAX_REQUESTS,
    customRules: STRICT_RULES,
};
