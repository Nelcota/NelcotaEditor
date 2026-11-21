import DownloadMinimalisticIcon from "~icons/solar/download-minimalistic-linear";
import type { ClipView } from "#/modules/clips/clip-view";
import { Button } from "#/shared/ui/button";

interface ClipDownloadLinkProps {
    clip: ClipView;
    label: string;
    /** In a list every row has one, so there it is secondary: a screen keeps one primary action. */
    emphasis?: "primary" | "secondary";
}

const EMPHASIS_VARIANTS = { primary: "default", secondary: "outline" } as const;

/** Nothing to download until Brasa renders the clip. */
export function ClipDownloadLink({ clip, label, emphasis = "primary" }: ClipDownloadLinkProps) {
    const downloadUrl = clip.downloadUrl;

    if (downloadUrl === null) {
        return null;
    }

    return (
        <Button asChild variant={EMPHASIS_VARIANTS[emphasis]} className="font-semibold">
            <a href={downloadUrl} download>
                <DownloadMinimalisticIcon aria-hidden="true" />
                {label}
            </a>
        </Button>
    );
}
