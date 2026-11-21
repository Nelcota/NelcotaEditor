import { createServerFn } from "@tanstack/react-start";
import { getEnvironment } from "#/shared/server/env.server";

/** The Turnstile site key is public, but it lives in the server's env; null turns the widget off. */
export const getCaptchaSiteKey = createServerFn({ method: "GET" }).handler(
    async (): Promise<string | null> => {
        return getEnvironment().TURNSTILE_SITE_KEY ?? null;
    },
);
