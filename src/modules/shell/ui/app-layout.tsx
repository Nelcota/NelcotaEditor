import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ImpersonationBanner } from "#/modules/auth/ui/impersonation-banner";
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
                className="sr-only rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus-visible:ring-4 focus-visible:ring-ring/70"
            >
                Pular para o conteúdo
            </a>
            <div
                className={cn(
                    "min-h-dvh md:grid md:h-dvh md:min-h-0 md:grid-cols-[272px_minmax(0,1fr)]",
                    sidebar.isCollapsed === true && "md:grid-cols-[76px_minmax(0,1fr)]",
                )}
            >
                <aside
                    className={cn(
                        "hidden min-h-0 border-e bg-background px-3 py-3.5 md:block md:overflow-y-auto",
                        sidebar.isCollapsed === true && "px-2",
                    )}
                >
                    <AppSidebar
                        isCollapsed={sidebar.isCollapsed}
                        onToggleCollapsed={sidebar.toggle}
                    />
                </aside>
                <div className="flex min-w-0 flex-col md:overflow-y-auto md:[scrollbar-gutter:stable]">
                    <MobileTopBar />
                    {/* The page sits between two thin vertical rules, the frame of the landing page. */}
                    <div className="mx-auto flex w-full max-w-[1264px] flex-1 flex-col px-[min(1rem,4vi)] md:px-8">
                        <main
                            id="main"
                            tabIndex={-1}
                            className="relative isolate grid flex-1 content-start grid-cols-[minmax(0,1fr)] gap-6 border-x px-4 pt-6 pb-12 outline-none md:px-8 md:pt-10"
                        >
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 grid-backdrop"
                            />
                            <ImpersonationBanner />
                            <OfflineBanner />
                            <Outlet />
                        </main>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
