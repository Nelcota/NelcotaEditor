import { createFileRoute } from "@tanstack/react-router";
import { serveVideoThumbnail } from "#/modules/videos/server/serve-video-thumbnail.server";

export const Route = createFileRoute("/api/videos/$videoId/thumbnail")({
    server: {
        handlers: {
            GET: ({ request, params }) => serveVideoThumbnail(request, params.videoId),
        },
    },
});
