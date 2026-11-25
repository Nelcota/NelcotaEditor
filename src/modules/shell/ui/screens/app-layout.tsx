import { Outlet, useMatch, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppSidebar } from "#/modules/shell/ui/components/app-sidebar";
import { PageBar } from "#/modules/shell/ui/components/page-bar";
import { PhoneTabBar } from "#/modules/shell/ui/components/phone-tab-bar";
import { SectionRail } from "#/modules/shell/ui/components/section-rail";
import { useFocusMainOnNavigate } from "#/modules/shell/ui/hooks/use-focus-main-on-navigate";
import { InspectorToggle } from "#/shared/ui/inspector-toggle";
import { cn } from "#/shared/ui/cn";
import { NavigationProgress } from "#/shared/ui/navigation-progress";
import { OfflineBanner } from "#/shared/ui/offline-banner";
import { ThemeToggle } from "#/shared/ui/theme-toggle";
import { TooltipProvider } from "#/shared/ui/tooltip";
import { useStoredFlag } from "#/shared/ui/use-stored-flag";

const SIDEBAR_HIDDEN_KEY = "nelcota:sidebar-hidden";

const VIDEO_ROUTE_ID = "/_app/videos/$videoId";

/**
 * The video page lays out its own columns (page and inspector) and scrolls them apart. When its
 * route fails (a missing video, an error), the page shown is the plain 404 or error screen.
 */
function useIsVideoPage(): boolean {
    const status = useMatch({
        from: VIDEO_ROUTE_ID,
        shouldThrow: false,
        select: (match) => match.status,
    });

    return status === "pending" || status === "success";
}

/** The Studio is an editor that needs the whole window: no sidebar, top bar or tab bar. */
function useIsStudioPage(): boolean {
    const isVideoPage = useIsVideoPage();
    const search = useSearch({ strict: false });

    return isVideoPage === true && search.tab === "studio";
}

const SKIP_LINK_CLASS =
    "sr-only rounded-xl bg-primary-solid px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** The Studio's window: only the banners and the page, which scrolls on its own from md. */
function FocusLayout({ impersonationBanner }: { impersonationBanner: ReactNode }): ReactNode {
    return (
        <div className="flex min-h-dvh flex-col bg-background md:h-dvh">
            <div className="grid gap-2 p-2 [&:not(:has(>:not([data-empty=true])))]:hidden">
                {impersonationBanner}
                <OfflineBanner />
            </div>
            <main
                id="main"
                tabIndex={-1}
                className="relative flex min-h-0 min-w-0 flex-1 flex-col outline-none md:overflow-y-auto"
            >
                <Outlet />
            </main>
        </div>
    );
}

/**
 * Window shell (the owner's reference): the frame holds the sidebar, or the icon rail when it is
 * collapsed; one rounded panel holds the breadcrumb bar and the page. Phones drop the sidebar for a
 * tab bar and let the panel run edge to edge.
 */
interface AppLayoutProps {
    /**
     * Other modules build on the shell, so the route hands in their parts instead of the shell
     * importing them: the account menu at the sidebar's foot, the banner shown while an admin acts
     * as someone else, and the watcher that keeps processing videos current on every page.
     */
    accountMenu: ReactNode;
    impersonationBanner: ReactNode;
    videoProgressWatcher: ReactNode;
}

export function AppLayout({
    accountMenu,
    impersonationBanner,
    videoProgressWatcher,
}: AppLayoutProps): ReactNode {
    const sidebar = useStoredFlag(SIDEBAR_HIDDEN_KEY);
    const isSidebarHidden = sidebar.isOn;
    const isVideoPage = useIsVideoPage();
    const isStudioPage = useIsStudioPage();
    useFocusMainOnNavigate(isStudioPage);

    if (isStudioPage === true) {
        return (
            <TooltipProvider>
                <NavigationProgress />
                {videoProgressWatcher}
                <a href="#main" className={SKIP_LINK_CLASS}>
                    Pular para o conteúdo
                </a>
                <FocusLayout impersonationBanner={impersonationBanner} />
            </TooltipProvider>
        );
    }

    return (
        <TooltipProvider>
            <NavigationProgress />
            {videoProgressWatcher}
            <a href="#main" className={SKIP_LINK_CLASS}>
                Pular para o conteúdo
            </a>
            <div
                className={cn(
                    "flex min-h-dvh flex-col bg-frame md:grid md:h-dvh md:grid-cols-[288px_minmax(0,1fr)] md:py-2 md:pe-2",
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
                        <AppSidebar onCollapse={sidebar.toggle} accountMenu={accountMenu} />
                    </aside>
                )}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background md:rounded-frame md:border">
                    <PageBar>
                        <ThemeToggle className="size-9 rounded-xl" />
                        {isVideoPage === true && <InspectorToggle className="max-lg:hidden" />}
                    </PageBar>
                    {/* Hidden while every banner is absent or an empty status region. */}
                    <div className="grid gap-2 px-2 pb-2 [&:not(:has(>:not([data-empty=true])))]:hidden">
                        {impersonationBanner}
                        <OfflineBanner />
                    </div>
                    <main
                        id="main"
                        tabIndex={-1}
                        className={cn(
                            "relative grid min-h-0 min-w-0 flex-1 content-start grid-cols-[minmax(0,1fr)] outline-none md:overflow-y-auto",
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
