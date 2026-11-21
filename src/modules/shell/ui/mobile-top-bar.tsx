import HamburgerMenuIcon from "~icons/solar/hamburger-menu-linear";
import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AppSidebar } from "#/modules/shell/ui/app-sidebar";
import { BrandLogo } from "#/shared/ui/brand-logo";
import { Button } from "#/shared/ui/button";
import { ThemeToggle } from "#/shared/ui/theme-toggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "#/shared/ui/sheet";

/** Phones have no room for the sidebar, so the same sidebar lives in a sheet behind a menu button. */
export function MobileTopBar(): ReactNode {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();

    // Any navigation (a section, a recent video, "Novo vídeo") closes the sheet.
    useEffect(() => router.subscribe("onResolved", () => setIsMenuOpen(false)), [router]);

    return (
        // The trailing inset is smaller so the menu glyph, not its 40px box, ends on the same
        // 16px line the logo starts on.
        <header className="sticky top-0 z-20 flex h-14 items-center gap-1 border-b bg-background/80 ps-4 pe-1.5 backdrop-blur-xl md:hidden">
            <Link
                to="/"
                aria-label="Nelcota, ir para o início"
                className="rounded-lg outline-none transition-[opacity,scale] hover:opacity-85 focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]"
            >
                <BrandLogo />
            </Link>
            <span className="flex-1" />
            <ThemeToggle />
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Abrir menu">
                        <HamburgerMenuIcon aria-hidden="true" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="start" aria-describedby={undefined} className="pt-3.5">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <AppSidebar isCollapsed={false} />
                </SheetContent>
            </Sheet>
        </header>
    );
}
