import Pen2Icon from "~icons/solar/pen-2-linear";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";

interface OpenInStudioLinkProps {
    videoId: string;
    clipId: string;
    className?: string;
    /** E.g. `max-sm:sr-only` in a narrow row: it shows "Editar" and the name stays whole. */
    placeClassName?: string;
}

/** Takes the clip to the Studio tab, where its stretch, captions and look are edited. */
export function OpenInStudioLink(props: OpenInStudioLinkProps): ReactNode {
    const { videoId, clipId, className, placeClassName } = props;

    return (
        <Button asChild variant="outline" className={cn("font-semibold", className)}>
            <Link
                to="/videos/$videoId"
                params={{ videoId }}
                search={{ tab: "studio", clip: clipId }}
            >
                <Pen2Icon aria-hidden="true" />
                <span>
                    Editar<span className={placeClassName}> no Studio</span>
                </span>
            </Link>
        </Button>
    );
}
