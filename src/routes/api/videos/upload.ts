import { createFileRoute } from "@tanstack/react-router";
import { handleVideoUpload } from "#/modules/videos/server/upload-video.server";
import { handleApiRoute } from "#/shared/server/handle-api-route.server";

export const Route = createFileRoute("/api/videos/upload")({
    server: {
        handlers: {
            POST: ({ request }) =>
                handleApiRoute("POST /api/videos/upload", () => handleVideoUpload(request)),
        },
    },
});
