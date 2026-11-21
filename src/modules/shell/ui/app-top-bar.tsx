import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AccountMenuButton } from "#/modules/auth/ui/account-menu-button";
import { PAGE_FRAME_CLASS } from "#/modules/shell/ui/page-frame";
import { TopBarNav } from "#/modules/shell/ui/top-bar-nav";
import { NewVideoLink } from "#/modules/videos/ui/new-video-link";
import { BrandLogo } from "#/shared/ui/brand-logo";
import { cn } from "#/shared/ui/cn";
import { ThemeToggle } from "#/shared/ui/theme-toggle";

/**
 * The one bar: brand and sections on the leading side, theme, "Novo vídeo" and the account on the
 * trailing side, every item centred on one line. Phones keep the brand and the account here and
 * move the sections to the tab bar at the bottom.
 */
export function AppTopBar(): ReactNode {
    return (
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl">
            <div className={cn(PAGE_FRAME_CLASS, "flex h-14 items-center gap-2 md:h-16")}>
                <Link
                    to="/"
                    aria-label="Nelcota, ir para os vídeos"
                    className="me-4 rounded-lg outline-none transition-[opacity,scale] hover:opacity-85 focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]"
                >
                    <BrandLogo />
                </Link>
                <div className="hidden md:block">
                    <TopBarNav />
                </div>
                <span className="flex-1" />
                <ThemeToggle />
                <NewVideoLink emphasis="primary" className="max-md:hidden" />
                <AccountMenuButton />
            </div>
        </header>
    );
}
