import { Outlet, useMatchRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ImpersonationBanner } from "#/modules/auth/ui/impersonation-banner";
import { AppSidebar } from "#/modules/shell/ui/app-sidebar";
import { PageBar } from "#/modules/shell/ui/page-bar";
import { PhoneTabBar } from "#/modules/shell/ui/phone-tab-bar";
import { SectionRail } from "#/modules/shell/ui/section-rail";
import { useFocusMainOnNavigate } from "#/modules/shell/ui/use-focus-main-on-navigate";
import { InspectorToggle } from "#/modules/videos/ui/inspector-toggle";
import { cn } from "#/shared/ui/cn";
import { NavigationProgress } from "#/shared/ui/navigation-progress";
import { OfflineBanner } from "#/shared/ui/offline-banner";
import { ThemeToggle } from "#/shared/ui/theme-toggle";
import { TooltipProvider } from "#/shared/ui/tooltip";
import { useStoredFlag } from "#/shared/ui/use-stored-flag";

const SIDEBAR_HIDDEN_KEY = "nelcota:sidebar-hidden";

/** The video page lays out its own columns (page and inspector) and scrolls them apart. */
function useIsVideoPage(): boolean {
    const matchRoute = useMatchRoute();

    return matchRoute({ to: "/videos/$videoId", fuzzy: true }) !== false;
}

/**
 * Window shell (the owner's reference): the frame holds the sidebar, or the icon rail when it is
 * collapsed; one rounded panel holds the breadcrumb bar and the page. Phones drop the sidebar for a
 * tab bar and let the panel run edge to edge.
 */
export function AppLayout(): ReactNode {
    const sidebar = useStoredFlag(SIDEBAR_HIDDEN_KEY);
    const isSidebarHidden = sidebar.isOn;
    const isVideoPage = useIsVideoPage();
    useFocusMainOnNavigate();

    return (
        <TooltipProvider>
            <NavigationProgress />
            <a
                href="#main"
                className="sr-only rounded-xl bg-primary-solid px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus-visible:ring-4 focus-visible:ring-ring"
            >
                Pular para o conteúdo
            </a>
            <div
                className={cn(
                    "flex min-h-dvh flex-col bg-frame md:grid md:h-dvh md:grid-cols-[256px_minmax(0,1fr)] md:py-2 md:pe-2",
                    isSidebarHidden === true && "md:grid-cols-[68px_minmax(0,1fr)]",
                )}
            >
                {isSidebarHidden === true && (
                    <aside aria-label="Barra lateral recolhida" className="hidden min-h-0 md:block">
                        <SectionRail onExpand={sidebar.toggle} />
                    </aside>
                )}
                {isSidebarHidden === false && (
                    <aside aria-label="Barra lateral" className="hidden min-h-0 md:block">
                        <AppSidebar onCollapse={sidebar.toggle} />
                    </aside>
                )}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background md:rounded-[1.125rem] md:border">
                    <PageBar>
                        <ThemeToggle className="size-9 rounded-xl" />
                        {isVideoPage === true && <InspectorToggle className="max-lg:hidden" />}
                    </PageBar>
                    {/* Hidden while every banner is absent or an empty status region. */}
                    <div className="grid gap-2 px-2 pb-2 [&:not(:has(>:not([data-empty=true])))]:hidden">
                        <ImpersonationBanner />
                        <OfflineBanner />
                    </div>
                    <main
                        id="main"
                        tabIndex={-1}
                        className={cn(
                            "grid min-h-0 min-w-0 flex-1 content-start grid-cols-[minmax(0,1fr)] outline-none md:overflow-y-auto",
                            isVideoPage === false && "gap-6 px-4 pt-2 pb-28 md:px-8 md:pb-10",
                            isVideoPage === true && "pb-24 md:overflow-hidden md:pb-0",
                        )}
                    >
                        <Outlet />
                    </main>
                </div>
            </div>
            <PhoneTabBar />
        </TooltipProvider>
    );
}
