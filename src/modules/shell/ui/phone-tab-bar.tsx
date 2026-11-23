import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
    ACCOUNT_SECTION,
    HOME_PATH,
    NAV_SECTIONS,
    getSectionState,
} from "#/modules/shell/ui/nav-sections";
import type { NavSection } from "#/modules/shell/ui/nav-sections";
import { SectionTabLink } from "#/modules/shell/ui/section-tab-link";
import { useHasWorkingVideo } from "#/modules/videos/ui/use-has-working-video";

const PHONE_SECTIONS: ReadonlyArray<NavSection> = [...NAV_SECTIONS, ACCOUNT_SECTION];

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
                <SectionTabLink
                    key={section.path}
                    section={section}
                    state={getSectionState(section, pathname)}
                    hasActivity={section.path === HOME_PATH && hasWorkingVideo === true}
                />
            ))}
        </nav>
    );
}
