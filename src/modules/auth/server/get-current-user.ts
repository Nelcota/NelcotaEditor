import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { SessionUser } from "#/modules/auth/session-user";
import { getSessionUser } from "#/modules/auth/server/get-session-user.server";

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
    async (): Promise<SessionUser | null> => {
        const request = getRequest();
        return getSessionUser(request.headers);
    },
);
