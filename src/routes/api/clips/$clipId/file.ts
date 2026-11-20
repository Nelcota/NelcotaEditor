import { createFileRoute } from "@tanstack/react-router";
import { serveClipFile } from "#/modules/clips/server/serve-clip-file.server";

export const Route = createFileRoute("/api/clips/$clipId/file")({
    server: {
        handlers: {
            GET: ({ request, params }) => serveClipFile(request, params.clipId),
        },
    },
});
