import MoonIcon from "~icons/lucide/moon";
import SunIcon from "~icons/lucide/sun";
import { useHydrated } from "@tanstack/react-router";
import { useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import {
    readIsDarkTheme,
    subscribeToTheme,
    syncThemeColor,
    toggleTheme,
} from "#/shared/theme/theme";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";

/** Both icons are rendered and CSS shows the right one, so server and client HTML always match. */
export function ThemeToggle({ className }: { className?: string }): ReactNode {
    const isHydrated = useHydrated();
    const isDark = useSyncExternalStore(subscribeToTheme, readIsDarkTheme, () => false);

    useEffect(syncThemeColor, []);

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("text-muted-foreground hover:text-foreground", className)}
            disabled={isHydrated === false}
            onClick={toggleTheme}
            aria-label="Tema escuro"
            aria-pressed={isDark}
        >
            <SunIcon className="hidden dark:block" aria-hidden="true" />
            <MoonIcon className="dark:hidden" aria-hidden="true" />
        </Button>
    );
}
