import { createFileRoute } from "@tanstack/react-router";
import { handleAvatarUpload, serveAvatar } from "#/modules/auth/server/avatar-routes.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

export const Route = createFileRoute("/api/account/avatar")({
    server: {
        handlers: {
            GET: ({ request }) =>
                handleApiRoute("GET /api/account/avatar", () => serveAvatar(request)),
            POST: ({ request }) =>
                handleApiRoute("POST /api/account/avatar", () => handleAvatarUpload(request)),
        },
    },
});
