import PanelLeftIcon from "~icons/lucide/panel-left";
import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import { useStoredFlag } from "#/shared/ui/use-stored-flag";

/** Shared with the video page, which hides its inspector column when the flag is on. */
export const INSPECTOR_HIDDEN_KEY = "nelcota:inspector-hidden";

/** The video's details panel on the right, shown or hidden; remembered per browser. */
export function useIsInspectorHidden(): boolean {
    return useStoredFlag(INSPECTOR_HIDDEN_KEY).isOn;
}

/** The top bar's last button on a video page: the sidebar glyph mirrored, for the panel on the right. */
export function InspectorToggle({ className }: { className?: string }): ReactNode {
    const inspector = useStoredFlag(INSPECTOR_HIDDEN_KEY);
    let label = "Esconder detalhes do vídeo";

    if (inspector.isOn === true) {
        label = "Mostrar detalhes do vídeo";
    }

    return (
        <HintTooltip label={label}>
            <button
                type="button"
                onClick={inspector.toggle}
                aria-label={label}
                className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground outline-none transition-[color,background-color,scale] hover:bg-foreground/5 hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]",
                    className,
                )}
            >
                <PanelLeftIcon aria-hidden="true" className="size-5 -scale-x-100" />
            </button>
        </HintTooltip>
    );
}
