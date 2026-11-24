import ArrowLeftIcon from "~icons/lucide/arrow-left";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "#/shared/ui/button";

interface StudioBackLinkProps {
    videoId: string;
    clipId: string | undefined;
}

/** Leaves the editor for the video's clips, keeping the clip picked there. */
export function StudioBackLink({ videoId, clipId }: StudioBackLinkProps): ReactNode {
    return (
        <Button asChild variant="ghost" className="px-2.5 @2xl/studio:px-3">
            <Link
                to="/videos/$videoId"
                params={{ videoId }}
                search={{ tab: "clips", clip: clipId }}
                aria-label="Voltar para os cortes"
            >
                <ArrowLeftIcon aria-hidden="true" />
                <span className="hidden @2xl/studio:inline" aria-hidden="true">
                    Cortes
                </span>
            </Link>
        </Button>
    );
}
