import { createFileRoute } from "@tanstack/react-router";
import { serveVideoThumbnail } from "#/modules/videos/server/serve-video-thumbnail.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

export const Route = createFileRoute("/api/videos/$videoId/thumbnail")({
    server: {
        handlers: {
            GET: ({ request, params }) =>
                handleApiRoute("GET /api/videos/$videoId/thumbnail", () =>
                    serveVideoThumbnail(request, params.videoId),
                ),
        },
    },
});
