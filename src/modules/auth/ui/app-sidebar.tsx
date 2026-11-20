import SidebarMinimalisticIcon from "~icons/solar/sidebar-minimalistic-linear";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SidebarAccount } from "#/modules/auth/ui/sidebar-account";
import { NewVideoLink } from "#/modules/videos/ui/new-video-link";
import { RecentVideos } from "#/modules/videos/ui/recent-videos";
import { SidebarSections } from "#/modules/videos/ui/sidebar-sections";
import { BrandMark } from "#/shared/ui/brand-logo";
import { cn } from "#/shared/ui/cn";

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
        label = "Abrir barra lateral";
    }

    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={label}
            title={label}
            aria-expanded={isCollapsed === false}
            className="grid size-10 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:active:scale-[0.99]"
        >
            <SidebarMinimalisticIcon className="size-5" aria-hidden="true" />
        </button>
    );
}

/** The one navigation: brand, "Novo vídeo", the three sections, recent videos and the account. */
export function AppSidebar({ isCollapsed, onToggleCollapsed }: AppSidebarProps): ReactNode {
    return (
        <div className="flex h-full min-h-0 flex-col gap-1">
            <div
                className={cn(
                    "flex items-center gap-2.5 px-1.5 pb-3",
                    isCollapsed === true && "flex-col px-0",
                )}
            >
                <Link
                    to="/"
                    aria-label="Nelcota, ir para o início"
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg outline-none transition-opacity hover:opacity-85 focus-visible:ring-4 focus-visible:ring-ring/50 motion-safe:active:scale-[0.99]"
                >
                    <BrandMark className="size-10" />
                    {isCollapsed === false && (
                        <span className="text-lg font-extrabold tracking-tight">Nelcota</span>
                    )}
                </Link>
                {onToggleCollapsed !== undefined && (
                    <CollapseButton isCollapsed={isCollapsed} onToggle={onToggleCollapsed} />
                )}
            </div>
            <div className="pb-2">
                <NewVideoLink emphasis="primary" isCompact={isCollapsed} />
            </div>
            <SidebarSections isCollapsed={isCollapsed} />
            <div className="min-h-0 flex-1 overflow-y-auto">
                <RecentVideos isCollapsed={isCollapsed} />
            </div>
            <SidebarAccount isCollapsed={isCollapsed} />
        </div>
    );
}
