import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { uploadFormatVideoFile } from "#/modules/videos/client/upload-video-file";
import { deleteVideo } from "#/modules/videos/server/video-functions";
import { loadEditSessionTitle } from "#/modules/viral-formats/model/load-edit-session-title";
import { EditSessionScreen } from "#/modules/viral-formats/ui/screens/edit-session-screen";

export const Route = createFileRoute("/_app/edits/$sessionId")({
    loader: async ({ context, params }) => ({
        title: await loadEditSessionTitle(context.queryClient, params.sessionId),
    }),
    head: ({ loaderData, match }) => {
        // A missing batch keeps the 404 page's title, which the root sets.
        if (match.status === "notFound") {
            return {};
        }

        return { meta: [{ title: `${loaderData?.title ?? "Edição"} · Editor Oculto` }] };
    },
    component: EditSessionRoute,
});

/** The batch page; uploads and deletions belong to the videos module, so they are passed in. */
function EditSessionRoute(): ReactNode {
    const params = Route.useParams();

    return (
        <EditSessionScreen
            sessionId={params.sessionId}
            uploadVideo={uploadFormatVideoFile}
            deleteVideo={async (videoId) => await deleteVideo({ data: { videoId } })}
        />
    );
}
