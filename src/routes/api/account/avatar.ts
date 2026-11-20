import { createFileRoute } from "@tanstack/react-router";
import { handleAvatarUpload, serveAvatar } from "#/modules/auth/server/avatar-routes.server";

export const Route = createFileRoute("/api/account/avatar")({
    server: {
        handlers: {
            GET: ({ request }) => serveAvatar(request),
            POST: ({ request }) => handleAvatarUpload(request),
        },
    },
});
