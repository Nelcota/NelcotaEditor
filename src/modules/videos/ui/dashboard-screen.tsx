import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { DashboardSearch } from "#/modules/videos/ui/dashboard-search";
import { NewVideoDialog } from "#/modules/videos/ui/new-video-dialog";
import { NewVideoLink } from "#/modules/videos/ui/new-video-link";
import { VideoList } from "#/modules/videos/ui/video-list";

const dashboardRoute = getRouteApi("/_app/videos/");

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
            <h1 className="sr-only">Vídeos</h1>
            <VideoList action={<NewVideoLink emphasis="primary" className="max-sm:w-full" />} />
            <NewVideoDialog
                isOpen={search.newVideo === true}
                onOpenChange={async (isOpen) => {
                    await navigate({
                        to: "/videos",
                        search: withNewVideo(search, isOpen),
                        replace: true,
                    });
                }}
            />
        </div>
    );
}
