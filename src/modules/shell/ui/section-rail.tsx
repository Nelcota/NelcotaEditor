import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ACCOUNT_SECTION, HOME_PATH, getSectionState } from "#/modules/shell/ui/nav-sections";
import { SectionTabLink } from "#/modules/shell/ui/section-tab-link";
import { useNavSections } from "#/modules/shell/ui/use-nav-sections";
import { useHasWorkingVideo } from "#/modules/videos/ui/use-has-working-video";

/** The full sidebar's current-row look, for the rail shown while the sidebar is hidden. */
const RAIL_TAB_CLASS =
    "rounded-xl hover:bg-foreground/5 hover:text-foreground focus-visible:ring-offset-0 aria-[current=page]:bg-foreground/[0.07]";

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
                <SectionTabLink
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
