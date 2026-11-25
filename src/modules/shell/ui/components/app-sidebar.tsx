import PanelLeftIcon from "~icons/lucide/panel-left";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ActivityBell } from "#/modules/shell/ui/components/activity-bell";
import { SidebarNav } from "#/modules/shell/ui/components/sidebar-nav";
import { BrandLogo } from "#/shared/ui/brand-logo";
import { Button } from "#/shared/ui/button";
import { HintTooltip } from "#/shared/ui/hint-tooltip";

const HIDE_LABEL = "Recolher a barra lateral";

/**
 * The sidebar on the window frame, in the reference's order: logo, bell and collapse; the
 * sections; then, at the foot, the person. Storage lives in Conta.
 */
interface AppSidebarProps {
    onCollapse: () => void;
    accountMenu: ReactNode;
}

export function AppSidebar({ onCollapse, accountMenu }: AppSidebarProps): ReactNode {
    return (
        <div className="flex h-full min-h-0 flex-col gap-2 py-4">
            <div className="flex h-12 shrink-0 items-center gap-1 ps-5 pe-2.5">
                <Link
                    to="/getting-started"
                    aria-label="Editor Oculto, ir para o início"
                    className="me-auto flex h-11 items-center rounded-xl pe-2 outline-none transition-[opacity,scale] hover:opacity-85 focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
                >
                    <BrandLogo className="gap-2.5 text-logo" />
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
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2.5 py-1">
                <SidebarNav />
            </div>
            <div className="shrink-0 px-2.5">{accountMenu}</div>
        </div>
    );
}
