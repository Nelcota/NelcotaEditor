import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppSidebar } from "#/modules/shell/ui/app-sidebar";
import { MobileTopBar } from "#/modules/shell/ui/mobile-top-bar";
import { useSidebarCollapsed } from "#/modules/shell/ui/use-sidebar-collapsed";
import { cn } from "#/shared/ui/cn";
import { NavigationProgress } from "#/shared/ui/navigation-progress";
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
            <NavigationProgress />
            <a
                href="#main"
                className="sr-only rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus-visible:ring-4 focus-visible:ring-ring/70"
            >
                Pular para o conteúdo
            </a>
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
                            "hidden min-h-0 border-r px-3 py-3.5 md:block md:overflow-y-auto",
                            sidebar.isCollapsed === true && "px-2",
                        )}
                    >
                        <AppSidebar
                            isCollapsed={sidebar.isCollapsed}
                            onToggleCollapsed={sidebar.toggle}
                        />
                    </aside>
                    <div className="min-w-0 md:overflow-y-auto md:[scrollbar-gutter:stable]">
                        <MobileTopBar />
                        <main
                            id="main"
                            tabIndex={-1}
                            className="mx-auto grid outline-none max-w-[1200px] grid-cols-[minmax(0,1fr)] gap-6 px-4 pt-6 pb-12 md:px-8 md:pt-9"
                        >
                            <OfflineBanner />
                            <Outlet />
                        </main>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
