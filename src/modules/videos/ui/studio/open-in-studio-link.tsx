import Pen2Icon from "~icons/solar/pen-2-linear";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "#/shared/ui/button";

interface OpenInStudioLinkProps {
    videoId: string;
    clipId: string;
}

/** Takes the clip to the Studio tab, where its stretch, captions and look are edited. */
export function OpenInStudioLink({ videoId, clipId }: OpenInStudioLinkProps): ReactNode {
    return (
        <Button asChild variant="outline" className="font-semibold">
            <Link
                to="/videos/$videoId"
                params={{ videoId }}
                search={{ tab: "studio", clip: clipId }}
            >
                <Pen2Icon aria-hidden="true" />
                Editar no Studio
            </Link>
        </Button>
    );
}
