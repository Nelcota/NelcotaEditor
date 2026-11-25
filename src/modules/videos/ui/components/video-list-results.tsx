import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";
import type { VideoSummary } from "#/modules/videos/model/video-views";
import { VIDEO_TABLE_COLUMNS, VideoListRow } from "#/modules/videos/ui/components/video-list-row";
import { Button } from "#/shared/ui/button";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

const TABLE_HEADINGS = [
    { id: "video", label: "Vídeo" },
    { id: "status", label: "Status" },
    { id: "source", label: "Origem" },
    { id: "clips", label: "Cortes" },
    { id: "progress", label: "Progresso" },
    { id: "created", label: "Enviado" },
    { id: "actions", label: "" },
];

/** The column names over the rows; the rows say the same to screen readers, so it is hidden. */
function TableHead(): ReactNode {
    return (
        <div
            aria-hidden="true"
            className={cn(
                "hidden h-11 items-center gap-x-4 bg-card px-4 text-xs font-semibold text-muted-foreground @4xl:grid",
                VIDEO_TABLE_COLUMNS,
            )}
        >
            {TABLE_HEADINGS.map((heading) => (
                <span key={heading.id}>{heading.label}</span>
            ))}
        </div>
    );
}

export interface NextVideoPage {
    hasNextPage: boolean;
    isFetching: boolean;
    hasFailed: boolean;
    onLoadMore: () => Promise<void>;
}

function LoadMoreVideos({ nextPage }: { nextPage: NextVideoPage }): ReactNode {
    const track = useTrackPromise();

    if (nextPage.hasNextPage === false) {
        return null;
    }

    return (
        <div className="grid justify-items-center gap-2">
            {nextPage.hasFailed === true && (
                <p role="alert" className="text-sm text-destructive">
                    Não foi possível carregar mais vídeos. Tente de novo.
                </p>
            )}
            <Button
                variant="secondary"
                disabled={nextPage.isFetching}
                aria-busy={nextPage.isFetching}
                onClick={() => track(nextPage.onLoadMore())}
            >
                Carregar mais vídeos
            </Button>
        </div>
    );
}

interface VideoListResultsProps {
    videos: Array<VideoSummary>;
    nextPage: NextVideoPage;
}

/** The loaded pages as one table of rows, and the button that brings the next page. */
export function VideoListResults({ videos, nextPage }: VideoListResultsProps): ReactNode {
    return (
        <>
            <div className="@container overflow-hidden rounded-2xl border">
                <TableHead />
                <ul aria-label="Seus vídeos" className="divide-y @4xl:border-t">
                    {videos.map((video) => (
                        <VideoListRow key={video.id} video={video} />
                    ))}
                </ul>
            </div>
            <LoadMoreVideos nextPage={nextPage} />
        </>
    );
}
