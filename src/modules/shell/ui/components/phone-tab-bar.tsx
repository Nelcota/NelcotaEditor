import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PHONE_SECTIONS, VIDEOS_PATH, getSectionState } from "#/modules/shell/model/nav-sections";
import { SectionTabLink } from "#/modules/shell/ui/components/section-tab-link";
import { useHasWorkingVideo } from "#/modules/shell/ui/hooks/use-has-working-video";

/** Phones only: the main sections at the bottom of the screen, where thumbs reach. */
export function PhoneTabBar(): ReactNode {
    const pathname = useLocation({ select: (location) => location.pathname });
    const hasWorkingVideo = useHasWorkingVideo();

    return (
        <nav
            aria-label="Seções"
            className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-frame pb-[env(safe-area-inset-bottom)] md:hidden"
        >
            {PHONE_SECTIONS.map((section) => (
                <SectionTabLink
                    key={section.path}
                    section={section}
                    state={getSectionState(section, pathname)}
                    hasActivity={section.path === VIDEOS_PATH && hasWorkingVideo === true}
                />
            ))}
        </nav>
    );
}
