import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { DashboardSearch } from "#/modules/videos/ui/dashboard-search";
import { NewVideoDialog } from "#/modules/videos/ui/new-video-dialog";
import { ALL_FILTER } from "#/modules/videos/ui/video-list-filter";
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

export function DashboardScreen() {
    const search = dashboardRoute.useSearch();
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <PageHeader
                title="Vídeos"
                description="Seus vídeos e os cortes que saíram de cada um."
            />
            <VideoList filter={search.status ?? ALL_FILTER} />
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
