import { createFileRoute } from "@tanstack/react-router";
import { serveVideoSource } from "#/modules/videos/server/serve-video-source.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

export const Route = createFileRoute("/api/videos/$videoId/source")({
    server: {
        handlers: {
            GET: ({ request, params }) =>
                handleApiRoute("GET /api/videos/$videoId/source", () =>
                    serveVideoSource(request, params.videoId),
                ),
        },
    },
});
