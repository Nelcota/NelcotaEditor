import AddIcon from "~icons/solar/add-linear";
import { useQuery } from "@tanstack/react-query";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import type { DashboardSearch } from "#/modules/videos/ui/dashboard-search";
import { NewVideoDialog } from "#/modules/videos/ui/new-video-dialog";
import { ALL_FILTER } from "#/modules/videos/ui/video-list-filter";
import { VideoList } from "#/modules/videos/ui/video-list";
import { videosQueryOptions } from "#/modules/videos/ui/video-queries";
import { Button } from "#/shared/ui/button";
import { PageHeader } from "#/shared/ui/page-header";

const dashboardRoute = getRouteApi("/_app/");

/** A closed dialog leaves no trace in the URL; the status filter is kept either way. */
function withNewVideo(search: DashboardSearch, isOpen: boolean): DashboardSearch {
    if (isOpen === false) {
        return { status: search.status };
    }

    return { status: search.status, newVideo: true };
}

/**
 * Phones only: on wider screens "Novo vídeo" lives at the top of the sidebar. Hidden on the first
 * visit too, where the empty state carries the only primary button.
 */
function MobileNewVideoButton() {
    const videosQuery = useQuery(videosQueryOptions());
    const videos = videosQuery.data;

    if (videos === undefined || videos.length === 0) {
        return null;
    }

    return (
        <Button asChild size="lg" className="rounded-full font-bold md:hidden">
            <Link to="/" search={(previous) => ({ ...previous, newVideo: true })}>
                <AddIcon aria-hidden="true" />
                Novo vídeo
            </Link>
        </Button>
    );
}

export function DashboardScreen() {
    const search = dashboardRoute.useSearch();
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <PageHeader
                title="Início"
                description="Seus vídeos e os cortes que saíram de cada um."
                action={<MobileNewVideoButton />}
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
