import { createFileRoute } from "@tanstack/react-router";
import { serveClipFile } from "#/modules/clips/server/serve-clip-file.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

export const Route = createFileRoute("/api/clips/$clipId/file")({
    server: {
        handlers: {
            GET: ({ request, params }) =>
                handleApiRoute("GET /api/clips/$clipId/file", () =>
                    serveClipFile(request, params.clipId),
                ),
        },
    },
});
