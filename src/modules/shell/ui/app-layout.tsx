import PanelLeftIcon from "~icons/lucide/panel-left";
import { Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ImpersonationBanner } from "#/modules/auth/ui/impersonation-banner";
import { AppSidebar } from "#/modules/shell/ui/app-sidebar";
import { PhoneTabBar } from "#/modules/shell/ui/phone-tab-bar";
import { SectionRail } from "#/modules/shell/ui/section-rail";
import { useFocusMainOnNavigate } from "#/modules/shell/ui/use-focus-main-on-navigate";
import { InspectorToggle } from "#/modules/videos/ui/inspector-toggle";
import { OpenVideoTabs } from "#/modules/videos/ui/open-video-tabs";
import { BrandLogo } from "#/shared/ui/brand-logo";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { HintTooltip } from "#/shared/ui/hint-tooltip";
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

interface TopBarProps {
    isSidebarHidden: boolean;
    onToggleSidebar: () => void;
    isVideoPage: boolean;
}

/**
 * The window's top bar, every item centred on y = 28. Over the sidebar: the brand on the sidebar's
 * icon and text lines, then the sidebar toggle. Over the panel: the open videos as tabs, then the
 * theme and, on a video, the inspector toggle on the panel's trailing line.
 */
function TopBar({ isSidebarHidden, onToggleSidebar, isVideoPage }: TopBarProps): ReactNode {
    let sidebarLabel = "Esconder a barra lateral";

    if (isSidebarHidden === true) {
        sidebarLabel = "Mostrar a barra lateral";
    }

    return (
        <header className="flex h-14 items-center gap-1 px-3">
            <div
                className={cn(
                    "flex shrink-0 items-center gap-1",
                    isSidebarHidden === false && "md:w-[256px]",
                )}
            >
                <Link
                    to="/"
                    aria-label="Nelcota, ir para os vídeos"
                    className="me-auto flex h-10 items-center rounded-xl px-2 outline-none transition-[opacity,scale] hover:opacity-85 focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99]"
                >
                    <BrandLogo className="gap-2 text-base" />
                </Link>
                <HintTooltip label={sidebarLabel}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleSidebar}
                        aria-label={sidebarLabel}
                        className="text-muted-foreground hover:text-foreground max-md:hidden"
                    >
                        <PanelLeftIcon aria-hidden="true" />
                    </Button>
                </HintTooltip>
            </div>
            <div className="ms-3 min-w-0 flex-1 max-md:hidden">
                <OpenVideoTabs />
            </div>
            <span className="flex-1 md:hidden" />
            <ThemeToggle className="rounded-xl" />
            {isVideoPage === true && <InspectorToggle className="max-lg:hidden" />}
        </header>
    );
}

/**
 * Window shell (from the owner's reference): a grey frame with the top bar and the sidebar, and one
 * white rounded panel for the page. Phones keep the bar's brand and theme, drop the sidebar for a
 * tab bar, and let the panel run edge to edge.
 */
export function AppLayout(): ReactNode {
    const sidebar = useStoredFlag(SIDEBAR_HIDDEN_KEY);
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
            <div className="flex min-h-dvh flex-col bg-frame md:h-dvh">
                <TopBar
                    isSidebarHidden={sidebar.isOn}
                    onToggleSidebar={sidebar.toggle}
                    isVideoPage={isVideoPage}
                />
                <div
                    className={cn(
                        "flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[280px_minmax(0,1fr)] md:pe-2 md:pb-2",
                        sidebar.isOn === true && "md:grid-cols-[88px_minmax(0,1fr)]",
                    )}
                >
                    {sidebar.isOn === true && (
                        <aside
                            aria-label="Barra lateral recolhida"
                            className="hidden min-h-0 md:block"
                        >
                            <SectionRail />
                        </aside>
                    )}
                    {sidebar.isOn === false && (
                        <aside aria-label="Barra lateral" className="hidden min-h-0 md:block">
                            <AppSidebar />
                        </aside>
                    )}
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background md:rounded-2xl md:border md:shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
                        {/* Hidden while every banner is absent or an empty status region. */}
                        <div className="grid gap-2 px-2 pt-2 [&:not(:has(>:not([data-empty=true])))]:hidden">
                            <ImpersonationBanner />
                            <OfflineBanner />
                        </div>
                        <main
                            id="main"
                            tabIndex={-1}
                            className={cn(
                                "grid min-h-0 min-w-0 flex-1 content-start grid-cols-[minmax(0,1fr)] outline-none md:overflow-y-auto",
                                isVideoPage === false &&
                                    "gap-6 px-4 pt-4 pb-28 md:px-8 md:pt-8 md:pb-12",
                                isVideoPage === true && "pb-24 md:overflow-hidden md:pb-0",
                            )}
                        >
                            <Outlet />
                        </main>
                    </div>
                </div>
            </div>
            <PhoneTabBar />
        </TooltipProvider>
    );
}
