import { createFileRoute } from "@tanstack/react-router";
import { receiveUploadFile } from "#/modules/videos/server/receive-upload-file.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

export const Route = createFileRoute("/api/videos/uploads/$uploadId/file")({
    server: {
        handlers: {
            PUT: ({ request, params }) =>
                handleApiRoute("PUT /api/videos/uploads/$uploadId/file", () =>
                    receiveUploadFile(request, params.uploadId),
                ),
        },
    },
});
