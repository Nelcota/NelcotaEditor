import BellIcon from "~icons/lucide/bell";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useWorkingVideoCount } from "#/modules/shell/ui/hooks/use-working-video-count";
import { Button } from "#/shared/ui/button";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import { pluralize } from "#/shared/ui/pluralize";

function describe(workingCount: number): string {
    if (workingCount === 0) {
        return "Nenhum vídeo sendo cortado agora";
    }

    return `${workingCount} ${pluralize(workingCount, "vídeo sendo cortado", "vídeos sendo cortados")}`;
}

/** The sidebar's bell: the videos at work, opened as the list filtered to them. */
export function ActivityBell(): ReactNode {
    const workingCount = useWorkingVideoCount();
    const label = describe(workingCount);

    return (
        <HintTooltip label={label}>
            <Button
                asChild
                variant="ghost"
                size="icon-sm"
                className="relative text-primary-ink hover:text-primary-ink"
            >
                <Link to="/videos" search={{ status: "processing" }} aria-label={label}>
                    <BellIcon aria-hidden="true" />
                    {workingCount > 0 && (
                        <span
                            aria-hidden="true"
                            className="absolute -top-0.5 -end-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-primary-solid px-1 text-xs leading-none font-bold text-primary-foreground tabular-nums"
                        >
                            {workingCount}
                        </span>
                    )}
                </Link>
            </Button>
        </HintTooltip>
    );
}
