import { createFileRoute } from "@tanstack/react-router";
import { serveEditFile } from "#/modules/viral-formats/server/serve-edit-file.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

export const Route = createFileRoute("/api/edits/$editId/file")({
    server: {
        handlers: {
            GET: ({ request, params }) =>
                handleApiRoute("GET /api/edits/$editId/file", () =>
                    serveEditFile(request, params.editId),
                ),
        },
    },
});
