import { createFileRoute } from "@tanstack/react-router";
import { serveSharedClip } from "#/modules/clips/server/serve-shared-clip.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

export const Route = createFileRoute("/api/share/$token")({
    server: {
        handlers: {
            GET: ({ request, params }) =>
                handleApiRoute("GET /api/share/$token", () =>
                    serveSharedClip(request, params.token),
                ),
        },
    },
});
