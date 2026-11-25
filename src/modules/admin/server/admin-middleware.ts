import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireAdmin } from "#/modules/admin/server/require-admin.server";

/** Every admin server function goes through this. */
export const adminMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
    const request = getRequest();
    const admin = await requireAdmin(request.headers);

    return next({ context: { admin, headers: request.headers } });
});
