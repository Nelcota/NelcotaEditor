import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ImpersonationBanner } from "#/modules/auth/ui/impersonation-banner";
import { AppTopBar } from "#/modules/shell/ui/app-top-bar";
import { PAGE_FRAME_CLASS } from "#/modules/shell/ui/page-frame";
import { PhoneTabBar } from "#/modules/shell/ui/phone-tab-bar";
import { cn } from "#/shared/ui/cn";
import { NavigationProgress } from "#/shared/ui/navigation-progress";
import { OfflineBanner } from "#/shared/ui/offline-banner";
import { TooltipProvider } from "#/shared/ui/tooltip";

/**
 * Console shell: one bar on top and the whole width for the page, on a 12-column grid between the
 * frame lines. Phones also get a tab bar at the bottom; the page leaves room for it.
 */
export function AppLayout(): ReactNode {
    return (
        <TooltipProvider>
            <NavigationProgress />
            <a
                href="#main"
                className="sr-only rounded-xl bg-primary-solid px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus-visible:ring-4 focus-visible:ring-ring/70"
            >
                Pular para o conteúdo
            </a>
            <div className="flex min-h-dvh flex-col">
                <AppTopBar />
                <main
                    id="main"
                    tabIndex={-1}
                    className={cn(
                        PAGE_FRAME_CLASS,
                        "grid flex-1 content-start grid-cols-[minmax(0,1fr)] gap-6 pt-6 pb-28 outline-none md:pt-8 md:pb-16",
                    )}
                >
                    <ImpersonationBanner />
                    <OfflineBanner />
                    <Outlet />
                </main>
                <PhoneTabBar />
            </div>
        </TooltipProvider>
    );
}
