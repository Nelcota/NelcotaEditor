import type { IconComponent } from "#/shared/ui/icon-component";
import type { ReactNode } from "react";
import { cn } from "#/shared/ui/cn";

/**
 * "current" is the page you are on; "parent" is the section a page belongs to (Início while a
 * video is open), shown without the selected fill so only one item reads as selected.
 */
export type NavItemState = "current" | "parent" | "none";

const ITEM_CLASS =
    "relative flex items-center gap-3 min-h-11 rounded-xl px-3 py-2.5 text-base font-semibold outline-none transition-colors hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99] [&>svg]:size-[22px] [&>svg]:shrink-0 [&>svg]:text-muted-foreground";

const STATE_CLASSES: Record<NavItemState, string> = {
    current: "bg-accent font-bold [&>svg]:text-primary",
    parent: "font-bold [&>svg]:text-primary",
    none: "",
};

const COLLAPSED_CLASS = "justify-center px-0";

interface SidebarNavContentProps {
    icon: IconComponent;
    label: string;
    count?: number;
    /** A small green dot on the icon, for news worth a glance (a video being processed). */
    hasActivity?: boolean;
    isCollapsed: boolean;
}

function ActivityDot(): ReactNode {
    return (
        <span
            aria-hidden="true"
            className="absolute top-2 left-[calc(50%+4px)] size-2 rounded-full bg-primary ring-2 ring-card"
        />
    );
}

/** Icon, label and an optional count: the inside of every sidebar link. Collapsed, only the icon. */
export function SidebarNavContent({
    icon: Icon,
    label,
    count,
    hasActivity = false,
    isCollapsed,
}: SidebarNavContentProps): ReactNode {
    if (isCollapsed === true) {
        return (
            <>
                <Icon aria-hidden="true" />
                {hasActivity === true && <ActivityDot />}
                <span className="sr-only">{label}</span>
            </>
        );
    }

    return (
        <>
            <Icon aria-hidden="true" />
            {label}
            {count !== undefined && (
                <span className="ml-auto text-[14px] font-bold text-muted-foreground tabular-nums">
                    {count}
                </span>
            )}
        </>
    );
}

export function sidebarNavItemClass(state: NavItemState, isCollapsed: boolean): string {
    return cn(ITEM_CLASS, STATE_CLASSES[state], isCollapsed === true && COLLAPSED_CLASS);
}
