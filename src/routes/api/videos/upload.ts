import { createFileRoute } from "@tanstack/react-router";
import { handleVideoUpload } from "#/modules/videos/server/upload-video.server";

export const Route = createFileRoute("/api/videos/upload")({
    server: {
        handlers: {
            POST: ({ request }) => handleVideoUpload(request),
        },
    },
});
