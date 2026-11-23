import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { VideoSummary } from "#/modules/videos/video-views";
import { VideoMascot } from "#/modules/videos/ui/video-mascot";
import { Button } from "#/shared/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "#/shared/ui/dropdown-menu";
import { pluralize } from "#/shared/ui/pluralize";

/** The open videos that do not fit as tabs, one click on "+N" away. */
export function MoreVideoTabs({ videos }: { videos: Array<VideoSummary> }): ReactNode {
    if (videos.length === 0) {
        return null;
    }

    const label = `Mais ${videos.length} ${pluralize(videos.length, "vídeo aberto", "vídeos abertos")}`;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    aria-label={label}
                    className="h-9 min-w-12 shrink-0 px-2.5 text-muted-foreground tabular-nums hover:text-foreground"
                >
                    +{videos.length}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
                {videos.map((video) => (
                    <DropdownMenuItem key={video.id} asChild>
                        <Link to="/videos/$videoId" params={{ videoId: video.id }}>
                            <VideoMascot videoId={video.id} className="size-5 shrink-0" />
                            <span className="min-w-0 truncate">{video.title}</span>
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
