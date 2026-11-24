import { createFileRoute } from "@tanstack/react-router";
import { serveVideoCaptions } from "#/modules/transcription/server/serve-video-captions.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

export const Route = createFileRoute("/api/videos/$videoId/captions")({
    server: {
        handlers: {
            GET: ({ request, params }) =>
                handleApiRoute("GET /api/videos/$videoId/captions", () =>
                    serveVideoCaptions(request, params.videoId),
                ),
        },
    },
});
