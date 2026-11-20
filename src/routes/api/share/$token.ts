import { createFileRoute } from "@tanstack/react-router";
import { serveSharedClip } from "#/modules/clips/server/serve-shared-clip.server";

export const Route = createFileRoute("/api/share/$token")({
    server: {
        handlers: {
            GET: ({ request, params }) => serveSharedClip(request, params.token),
        },
    },
});
