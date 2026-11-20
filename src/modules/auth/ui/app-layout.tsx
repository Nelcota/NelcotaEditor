import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppSidebar } from "#/modules/auth/ui/app-sidebar";
import { MobileTopBar } from "#/modules/auth/ui/mobile-top-bar";
import { useSidebarCollapsed } from "#/modules/auth/ui/use-sidebar-collapsed";
import { cn } from "#/shared/ui/cn";
import { OfflineBanner } from "#/shared/ui/offline-banner";
import { TooltipProvider } from "#/shared/ui/tooltip";

/**
 * Console shell: one framed panel with a single sidebar (sections, recent videos, account) that
 * can collapse to icons, and the page, which scrolls on its own. Phones get a top bar instead.
 */
export function AppLayout(): ReactNode {
    const sidebar = useSidebarCollapsed();

    return (
        <TooltipProvider>
            <div className="min-h-dvh md:h-dvh md:p-2">
                <div
                    className={cn(
                        "md:grid md:h-full md:min-h-0 md:overflow-hidden md:rounded-2xl md:border md:bg-card",
                        "md:grid-cols-[272px_minmax(0,1fr)]",
                        sidebar.isCollapsed === true && "md:grid-cols-[76px_minmax(0,1fr)]",
                    )}
                >
                    <aside
                        className={cn(
                            "hidden min-h-0 border-r px-3 py-3.5 md:block",
                            sidebar.isCollapsed === true && "px-2",
                        )}
                    >
                        <AppSidebar
                            isCollapsed={sidebar.isCollapsed}
                            onToggleCollapsed={sidebar.toggle}
                        />
                    </aside>
                    <div className="min-w-0 md:overflow-y-auto">
                        <MobileTopBar />
                        <main className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)] gap-6 px-4 pt-6 pb-12 md:px-8 md:pt-9">
                            <OfflineBanner />
                            <Outlet />
                        </main>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
