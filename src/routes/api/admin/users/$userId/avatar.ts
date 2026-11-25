import { createFileRoute } from "@tanstack/react-router";
import { serveAdminUserAvatar } from "#/modules/admin/server/serve-admin-user-avatar.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

export const Route = createFileRoute("/api/admin/users/$userId/avatar")({
    server: {
        handlers: {
            GET: ({ request, params }) =>
                handleApiRoute("GET /api/admin/users/$userId/avatar", () =>
                    serveAdminUserAvatar(request, params.userId),
                ),
        },
    },
});
