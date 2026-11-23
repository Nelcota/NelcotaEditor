import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
    ACCOUNT_SECTION,
    HOME_PATH,
    NAV_SECTIONS,
    getSectionState,
} from "#/modules/shell/ui/nav-sections";
import type { NavSection, NavSectionState } from "#/modules/shell/ui/nav-sections";
import { useHasWorkingVideo } from "#/modules/videos/ui/use-has-working-video";
import { SectionIcon } from "#/modules/shell/ui/section-icon";
import { useNavSections } from "#/modules/shell/ui/use-nav-sections";
import { cn } from "#/shared/ui/cn";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";

const TAB_CLASS =
    "relative grid h-16 content-center justify-items-center gap-1 text-xs font-medium text-muted-foreground outline-none transition-[color,scale] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring motion-safe:active:scale-[0.99] [&>svg]:size-6";

const STATE_CLASSES: Record<NavSectionState, string> = {
    current: "text-foreground",
    parent: "text-foreground",
    none: "",
};

const PHONE_SECTIONS: ReadonlyArray<NavSection> = [...NAV_SECTIONS, ACCOUNT_SECTION];

/** The full sidebar's current-row look, for the rail shown while the sidebar is hidden. */
const RAIL_TAB_CLASS =
    "rounded-xl hover:bg-foreground/5 hover:text-foreground focus-visible:ring-offset-0 aria-[current=page]:bg-foreground/[0.07]";

interface TabLinkProps {
    section: NavSection;
    state: NavSectionState;
    hasActivity: boolean;
    className?: string;
}

function TabLink({ section, state, hasActivity, className }: TabLinkProps): ReactNode {
    return (
        <Link
            to={section.path}
            aria-current={toAriaCurrent(state === "current")}
            className={cn(TAB_CLASS, STATE_CLASSES[state], className)}
        >
            <SectionIcon section={section} state={state} />
            {section.label}
            {hasActivity === true && (
                <>
                    <span
                        aria-hidden="true"
                        className="absolute top-3 start-[calc(50%+8px)] size-2 rounded-full bg-primary ring-2 ring-background"
                    />
                    <span className="sr-only">, processando</span>
                </>
            )}
        </Link>
    );
}

/** Phones only: the rail's sections and the account at the bottom of the screen, where thumbs reach. */
export function PhoneTabBar(): ReactNode {
    const pathname = useLocation({ select: (location) => location.pathname });
    const hasWorkingVideo = useHasWorkingVideo();

    return (
        <nav
            aria-label="Seções"
            className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
        >
            {PHONE_SECTIONS.map((section) => (
                <TabLink
                    key={section.path}
                    section={section}
                    state={getSectionState(section, pathname)}
                    hasActivity={section.path === HOME_PATH && hasWorkingVideo === true}
                />
            ))}
        </nav>
    );
}

/**
 * Desktop with the sidebar hidden: the same sections stacked in a narrow rail, each icon with its
 * name, so moving between sections never needs the sidebar back. Conta stands in for the account menu.
 */
export function SectionRail(): ReactNode {
    const pathname = useLocation({ select: (location) => location.pathname });
    const hasWorkingVideo = useHasWorkingVideo();
    const sections = [...useNavSections(), ACCOUNT_SECTION];

    return (
        <nav aria-label="Seções" className="grid content-start gap-1 px-2">
            {sections.map((section) => (
                <TabLink
                    key={section.path}
                    section={section}
                    state={getSectionState(section, pathname)}
                    hasActivity={section.path === HOME_PATH && hasWorkingVideo === true}
                    className={RAIL_TAB_CLASS}
                />
            ))}
        </nav>
    );
}
