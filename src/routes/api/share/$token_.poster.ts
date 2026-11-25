import { createFileRoute } from "@tanstack/react-router";
import { serveSharedClipPoster } from "#/modules/clips/server/serve-shared-clip.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

export const Route = createFileRoute("/api/share/$token_/poster")({
    server: {
        handlers: {
            GET: ({ request, params }) =>
                handleApiRoute("GET /api/share/$token/poster", () =>
                    serveSharedClipPoster(request, params.token),
                ),
        },
    },
});
