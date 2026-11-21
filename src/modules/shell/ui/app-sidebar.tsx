import SidebarMinimalisticIcon from "~icons/solar/sidebar-minimalistic-linear";
import { Link, useMatchRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SidebarAccount } from "#/modules/auth/ui/sidebar-account";
import { NewVideoLink } from "#/modules/videos/ui/new-video-link";
import { RecentVideos } from "#/modules/videos/ui/recent-videos";
import { SidebarSections } from "#/modules/videos/ui/sidebar-sections";
import { BrandMark } from "#/shared/ui/brand-logo";
import { cn } from "#/shared/ui/cn";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
import { ThemeToggle } from "#/shared/ui/theme-toggle";

interface AppSidebarProps {
    isCollapsed: boolean;
    /** Absent on phones, where the sidebar lives in a sheet and does not collapse. */
    onToggleCollapsed?: () => void;
}

interface CollapseButtonProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

function CollapseButton({ isCollapsed, onToggle }: CollapseButtonProps): ReactNode {
    let label = "Recolher barra lateral";

    if (isCollapsed === true) {
        label = "Expandir barra lateral";
    }

    return (
        <HintTooltip label={label}>
            <button
                type="button"
                onClick={onToggle}
                aria-label={label}
                aria-expanded={isCollapsed === false}
                className="grid size-10 place-items-center rounded-xl text-muted-foreground outline-none transition-[color,background-color,border-color,box-shadow,scale] hover:bg-foreground/5 hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]"
            >
                <SidebarMinimalisticIcon className="size-5" aria-hidden="true" />
            </button>
        </HintTooltip>
    );
}

type Emphasis = "primary" | "secondary";

/** The video page has its own primary action, so the sidebar's "Novo vídeo" steps back there. */
function useNewVideoEmphasis(): Emphasis {
    const matchRoute = useMatchRoute();

    if (matchRoute({ to: "/videos/$videoId", fuzzy: true }) !== false) {
        return "secondary";
    }

    return "primary";
}

/** The one navigation: brand, "Novo vídeo", the three sections, recent videos and the account. */
export function AppSidebar({ isCollapsed, onToggleCollapsed }: AppSidebarProps): ReactNode {
    const newVideoEmphasis = useNewVideoEmphasis();

    return (
        <div className="flex h-full min-h-0 flex-col gap-1">
            <div
                className={cn(
                    "flex items-center gap-1 pb-3",
                    // No trailing inset: the collapse glyph then shares the trailing centre line
                    // with the Recentes chevron and the account menu.
                    isCollapsed === false && "ps-1.5",
                    isCollapsed === true && "flex-col",
                )}
            >
                <Link
                    to="/"
                    aria-label="Nelcota, ir para o início"
                    className={cn(
                        "flex min-w-0 items-center gap-2.5 rounded-lg outline-none transition-[opacity,scale] hover:opacity-85 focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]",
                        // An auto margin instead of flex-1 keeps the link clear of the sheet's close button.
                        isCollapsed === false && "me-auto",
                    )}
                >
                    <BrandMark className="size-9" />
                    {isCollapsed === false && (
                        <span className="text-xl leading-none font-bold tracking-[0.01em]">
                            NELCOTA
                        </span>
                    )}
                </Link>
                {onToggleCollapsed !== undefined && (
                    <>
                        <ThemeToggle />
                        <CollapseButton isCollapsed={isCollapsed} onToggle={onToggleCollapsed} />
                    </>
                )}
            </div>
            <div className="pb-2">
                <NewVideoLink emphasis={newVideoEmphasis} isCompact={isCollapsed} />
            </div>
            <SidebarSections isCollapsed={isCollapsed} />
            <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
                <RecentVideos isCollapsed={isCollapsed} />
            </div>
            <SidebarAccount isCollapsed={isCollapsed} />
        </div>
    );
}
