import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { StudioTab } from "#/modules/studio/ui/screens/studio-tab";
import { loadVideoPageTitle } from "#/modules/videos/model/load-video-page-title";
import { VideoDetailsScreen } from "#/modules/videos/ui/screens/video-details-screen";
import { videoPageSearchSchema } from "#/modules/videos/model/video-page-search";

export const Route = createFileRoute("/_app/videos/$videoId")({
    validateSearch: videoPageSearchSchema,
    loader: async ({ context, params }) => ({
        title: await loadVideoPageTitle(context.queryClient, params.videoId),
    }),
    head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.title ?? "Vídeo"} · Nelcota` }] }),
    component: VideoDetailsRoute,
});

function VideoDetailsRoute(): ReactNode {
    const params = Route.useParams();
    const search = Route.useSearch();

    return <VideoDetailsScreen videoId={params.videoId} search={search} StudioTab={StudioTab} />;
}
