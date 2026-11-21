import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { HOME_PATH, getSectionState } from "#/modules/shell/ui/nav-sections";
import type { NavSection, NavSectionState } from "#/modules/shell/ui/nav-sections";
import { useNavSections } from "#/modules/shell/ui/use-nav-sections";
import { useHasWorkingVideo } from "#/modules/videos/ui/use-has-working-video";
import { cn } from "#/shared/ui/cn";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";

const ITEM_CLASS =
    "relative inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground outline-none transition-[color,background-color,box-shadow,scale] hover:bg-secondary hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/70 motion-safe:active:scale-[0.99] [&>svg]:size-5 [&>svg]:shrink-0";

const STATE_CLASSES: Record<NavSectionState, string> = {
    current: "bg-secondary text-foreground",
    parent: "text-foreground",
    none: "",
};

interface TopBarLinkProps {
    section: NavSection;
    state: NavSectionState;
    hasActivity: boolean;
}

function TopBarLink({ section, state, hasActivity }: TopBarLinkProps): ReactNode {
    const Icon = section.icon;

    return (
        <Link
            to={section.path}
            aria-current={toAriaCurrent(state === "current")}
            className={cn(ITEM_CLASS, STATE_CLASSES[state])}
        >
            <Icon aria-hidden="true" />
            {section.label}
            {hasActivity === true && (
                <span
                    aria-label="Processando"
                    className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse"
                />
            )}
        </Link>
    );
}

/** The sections, side by side in the desktop bar. */
export function TopBarNav(): ReactNode {
    const pathname = useLocation({ select: (location) => location.pathname });
    const sections = useNavSections();
    const hasWorkingVideo = useHasWorkingVideo();

    return (
        <nav aria-label="Seções" className="flex items-center gap-1">
            {sections.map((section) => (
                <TopBarLink
                    key={section.path}
                    section={section}
                    state={getSectionState(section, pathname)}
                    hasActivity={section.path === HOME_PATH && hasWorkingVideo === true}
                />
            ))}
        </nav>
    );
}
