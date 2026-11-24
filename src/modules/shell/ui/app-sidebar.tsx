import PanelLeftIcon from "~icons/lucide/panel-left";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AccountMenuButton } from "#/modules/auth/ui/account-menu-button";
import { ActivityBell } from "#/modules/shell/ui/activity-bell";
import { NewVideoCard } from "#/modules/shell/ui/new-video-card";
import { SidebarNav } from "#/modules/shell/ui/sidebar-nav";
import { StorageCard } from "#/modules/shell/ui/storage-card";
import { BrandLogo } from "#/shared/ui/brand-logo";
import { Button } from "#/shared/ui/button";
import { HintTooltip } from "#/shared/ui/hint-tooltip";

const HIDE_LABEL = "Recolher a barra lateral";

/**
 * The sidebar on the window frame, in the reference's order: logo, bell and collapse; the new
 * video card; the sections; then, at the foot, the storage card and the person.
 */
export function AppSidebar({ onCollapse }: { onCollapse: () => void }): ReactNode {
    return (
        <div className="flex h-full min-h-0 flex-col gap-2 px-2.5 pt-2 pb-2">
            <div className="flex h-12 items-center gap-1 ps-2.5">
                <Link
                    to="/"
                    aria-label="Nelcota, ir para o início"
                    className="me-auto flex h-11 items-center rounded-xl pe-2 outline-none transition-[opacity,scale] hover:opacity-85 focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
                >
                    <BrandLogo className="gap-2.5 text-[1.3125rem] [&>*:first-child]:size-[1.625rem]" />
                </Link>
                <ActivityBell />
                <HintTooltip label={HIDE_LABEL}>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onCollapse}
                        aria-label={HIDE_LABEL}
                        className="text-primary-ink hover:text-primary-ink"
                    >
                        <PanelLeftIcon aria-hidden="true" />
                    </Button>
                </HintTooltip>
            </div>
            <NewVideoCard />
            <div className="relative min-h-0 flex-1 overflow-y-auto pt-1">
                <SidebarNav />
            </div>
            <StorageCard />
            <AccountMenuButton />
        </div>
    );
}
