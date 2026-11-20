import Chart2Icon from "~icons/solar/chart-2-linear";
import ClapperboardPlayIcon from "~icons/solar/clapperboard-play-linear";
import Home2Icon from "~icons/solar/home-2-linear";
import UserCircleIcon from "~icons/solar/user-circle-linear";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import type { IconComponent } from "#/shared/ui/icon-component";
import { isVideoWorking } from "#/modules/videos/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";
import type { NavItemState } from "#/modules/videos/ui/sidebar-nav-item";
import { SidebarNavContent, sidebarNavItemClass } from "#/modules/videos/ui/sidebar-nav-item";
import { videosQueryOptions } from "#/modules/videos/ui/video-queries";
import { CollapsibleTooltip } from "#/shared/ui/collapsible-tooltip";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";

type SectionPath = "/overview" | "/" | "/clips" | "/account";

type SectionCounts = Partial<Record<SectionPath, number>>;

interface Section {
    path: SectionPath;
    label: string;
    icon: IconComponent;
}

const HOME_PATH = "/";
const VIDEO_PAGE_PREFIX = "/videos/";

const SECTIONS: ReadonlyArray<Section> = [
    { path: HOME_PATH, label: "Início", icon: Home2Icon },
    { path: "/clips", label: "Cortes", icon: ClapperboardPlayIcon },
    { path: "/overview", label: "Painel", icon: Chart2Icon },
    { path: "/account", label: "Conta", icon: UserCircleIcon },
];

/** A video's own page belongs to "Início", but only the video itself reads as selected. */
function getSectionState(section: Section, pathname: string): NavItemState {
    if (pathname === section.path) {
        return "current";
    }

    if (section.path === HOME_PATH && pathname.startsWith(VIDEO_PAGE_PREFIX) === true) {
        return "parent";
    }

    return "none";
}

/** Until the videos load there is no count to show. */
function countSectionItems(videos: Array<VideoSummary> | undefined): SectionCounts {
    if (videos === undefined) {
        return {};
    }

    return {
        "/": videos.length,
        "/clips": videos.reduce((total, video) => total + video.readyClipCount, 0),
    };
}

/** Collapsed, the count is hidden, so the tooltip carries it. */
function describeSection(section: Section, count: number | undefined): string {
    if (count === undefined) {
        return section.label;
    }

    return `${section.label} · ${count}`;
}

interface SectionLinkProps {
    section: Section;
    state: NavItemState;
    isCollapsed: boolean;
    count: number | undefined;
    hasActivity: boolean;
}

function SectionLink({ section, state, isCollapsed, count, hasActivity }: SectionLinkProps) {
    return (
        <CollapsibleTooltip label={describeSection(section, count)} isEnabled={isCollapsed}>
            <Link
                to={section.path}
                aria-current={toAriaCurrent(state === "current")}
                className={sidebarNavItemClass(state, isCollapsed)}
            >
                <SidebarNavContent
                    icon={section.icon}
                    label={section.label}
                    count={count}
                    hasActivity={hasActivity}
                    isCollapsed={isCollapsed}
                />
            </Link>
        </CollapsibleTooltip>
    );
}

/** The places in the app; the card at the bottom keeps the quick account menu too. */
export function SidebarSections({ isCollapsed }: { isCollapsed: boolean }) {
    const pathname = useLocation({ select: (location) => location.pathname });
    const videosQuery = useQuery(videosQueryOptions());
    const videos = videosQuery.data;
    const counts = countSectionItems(videos);
    const hasWorkingVideo = videos?.some((video) => isVideoWorking(video.status) === true);

    return (
        <nav aria-label="Seções" className="grid gap-0.5">
            {SECTIONS.map((section) => (
                <SectionLink
                    key={section.path}
                    section={section}
                    state={getSectionState(section, pathname)}
                    isCollapsed={isCollapsed}
                    count={counts[section.path]}
                    hasActivity={section.path === HOME_PATH && hasWorkingVideo === true}
                />
            ))}
        </nav>
    );
}
