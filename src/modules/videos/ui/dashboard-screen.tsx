import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { DashboardSearch } from "#/modules/videos/ui/dashboard-search";
import { NewVideoDialog } from "#/modules/videos/ui/new-video-dialog";
import { NewVideoLink } from "#/modules/videos/ui/new-video-link";
import { VideoList } from "#/modules/videos/ui/video-list";
import { PageHeader } from "#/shared/ui/page-header";

const dashboardRoute = getRouteApi("/_app/");

/** A closed dialog leaves no trace in the URL; the status filter is kept either way. */
function withNewVideo(search: DashboardSearch, isOpen: boolean): DashboardSearch {
    if (isOpen === false) {
        return { status: search.status };
    }

    return { status: search.status, newVideo: true };
}

export function DashboardScreen(): ReactNode {
    const search = dashboardRoute.useSearch();
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
            <PageHeader
                title="Vídeos"
                description="Seus vídeos e os cortes que saíram de cada um."
                action={<NewVideoLink emphasis="primary" />}
            />
            <VideoList />
            <NewVideoDialog
                isOpen={search.newVideo === true}
                onOpenChange={async (isOpen) => {
                    await navigate({
                        to: "/",
                        search: withNewVideo(search, isOpen),
                        replace: true,
                    });
                }}
            />
        </div>
    );
}
