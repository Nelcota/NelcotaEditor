import type { ReactNode } from "react";
import DownloadMinimalisticIcon from "~icons/solar/download-minimalistic-linear";
import type { ClipView } from "#/modules/clips/clip-view";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";

interface ClipDownloadLinkProps {
    clip: ClipView;
    label: string;
    /** In a list every row has one, so there it is secondary: a screen keeps one primary action. */
    emphasis?: "primary" | "secondary";
    className?: string;
    /** E.g. `max-sm:sr-only` for an icon-only link on phones; the label stays its name. */
    labelClassName?: string;
}

const EMPHASIS_VARIANTS = { primary: "default", secondary: "outline" } as const;

/** Nothing to download until Brasa renders the clip. */
export function ClipDownloadLink(props: ClipDownloadLinkProps): ReactNode {
    const { clip, label, emphasis = "primary", className, labelClassName } = props;
    const downloadUrl = clip.downloadUrl;

    if (downloadUrl === null) {
        return null;
    }

    return (
        <Button
            asChild
            variant={EMPHASIS_VARIANTS[emphasis]}
            className={cn("font-medium", className)}
        >
            <a href={downloadUrl} download>
                <DownloadMinimalisticIcon aria-hidden="true" />
                <span className={labelClassName}>{label}</span>
            </a>
        </Button>
    );
}
