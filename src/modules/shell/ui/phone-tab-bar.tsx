import AddIcon from "~icons/solar/add-linear";
import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { HOME_PATH, NAV_SECTIONS, getSectionState } from "#/modules/shell/ui/nav-sections";
import type { NavSection, NavSectionState } from "#/modules/shell/ui/nav-sections";
import { useHasWorkingVideo } from "#/modules/videos/ui/use-has-working-video";
import { cn } from "#/shared/ui/cn";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";

const TAB_CLASS =
    "relative grid h-16 content-center justify-items-center gap-1 text-xs font-medium text-muted-foreground outline-none transition-[color,scale] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/70 motion-safe:active:scale-[0.97] [&>svg]:size-6";

const STATE_CLASSES: Record<NavSectionState, string> = {
    current: "text-foreground",
    parent: "text-foreground",
    none: "",
};

interface TabLinkProps {
    section: NavSection;
    state: NavSectionState;
    hasActivity: boolean;
}

function TabLink({ section, state, hasActivity }: TabLinkProps): ReactNode {
    const Icon = section.icon;

    return (
        <Link
            to={section.path}
            aria-current={toAriaCurrent(state === "current")}
            className={cn(TAB_CLASS, STATE_CLASSES[state])}
        >
            <Icon aria-hidden="true" />
            {section.label}
            {hasActivity === true && (
                <span
                    aria-label="Processando"
                    className="absolute top-3 start-[calc(50%+8px)] size-2 rounded-full bg-primary ring-2 ring-background"
                />
            )}
        </Link>
    );
}

/** "Novo vídeo" sits in the middle of the bar, under the thumb. */
function NewVideoTab(): ReactNode {
    return (
        <Link
            to="/"
            search={{ newVideo: true }}
            preload="intent"
            className="group grid h-16 place-items-center outline-none"
        >
            <span className="grid size-11 place-items-center rounded-xl bg-primary-solid text-primary-foreground transition-[background-color,scale] hover:bg-[color-mix(in_oklab,var(--primary-solid)_88%,black)] group-focus-visible:ring-4 group-focus-visible:ring-ring/70 motion-safe:group-active:scale-[0.97]">
                <AddIcon aria-hidden="true" className="size-6" />
            </span>
            <span className="sr-only">Novo vídeo</span>
        </Link>
    );
}

/** Phones only: the sections at the bottom of the screen, where thumbs reach. */
export function PhoneTabBar(): ReactNode {
    const pathname = useLocation({ select: (location) => location.pathname });
    const hasWorkingVideo = useHasWorkingVideo();
    const [videosSection, clipsSection, overviewSection] = NAV_SECTIONS;

    if (
        videosSection === undefined ||
        clipsSection === undefined ||
        overviewSection === undefined
    ) {
        throw new Error("The phone tab bar needs the Vídeos, Cortes and Painel sections.");
    }

    return (
        <nav
            aria-label="Seções"
            className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        >
            <TabLink
                section={videosSection}
                state={getSectionState(videosSection, pathname)}
                hasActivity={videosSection.path === HOME_PATH && hasWorkingVideo === true}
            />
            <TabLink
                section={clipsSection}
                state={getSectionState(clipsSection, pathname)}
                hasActivity={false}
            />
            <NewVideoTab />
            <TabLink
                section={overviewSection}
                state={getSectionState(overviewSection, pathname)}
                hasActivity={false}
            />
        </nav>
    );
}
