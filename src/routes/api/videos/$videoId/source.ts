import { createFileRoute } from "@tanstack/react-router";
import { serveVideoSource } from "#/modules/videos/server/serve-video-source.server";

export const Route = createFileRoute("/api/videos/$videoId/source")({
    server: {
        handlers: {
            GET: ({ request, params }) => serveVideoSource(request, params.videoId),
        },
    },
});
