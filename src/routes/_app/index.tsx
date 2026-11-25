import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { HomeScreen } from "#/modules/shell/ui/screens/home-screen";
import { RecentVideos } from "#/modules/videos/ui/components/recent-videos";
import { VideoLinkComposer } from "#/modules/videos/ui/components/video-link-composer";

export const Route = createFileRoute("/_app/")({
    head: () => ({ meta: [{ title: "Início · Nelcota" }] }),
    component: HomeRoute,
});

function HomeRoute(): ReactNode {
    return <HomeScreen linkComposer={<VideoLinkComposer />} recentVideos={<RecentVideos />} />;
}
