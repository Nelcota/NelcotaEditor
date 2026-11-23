import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { AccountMenuButton } from "#/modules/auth/ui/account-menu-button";
import { HOME_PATH, getSectionState } from "#/modules/shell/ui/nav-sections";
import type { NavSection } from "#/modules/shell/ui/nav-sections";
import { SectionIcon } from "#/modules/shell/ui/section-icon";
import { useNavSections } from "#/modules/shell/ui/use-nav-sections";
import type { VideoSummary } from "#/modules/videos/video-views";
import { SearchField } from "#/modules/videos/ui/search-field";
import { SIDEBAR_ITEM_CLASS, SidebarVideos } from "#/modules/videos/ui/sidebar-videos";
import { useVideosQuery } from "#/modules/videos/ui/use-videos-query";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";

/** The count beside a section: videos for Vídeos, ready clips for Cortes, nothing elsewhere. */
function countFor(section: NavSection, videos: Array<VideoSummary>): number | null {
    if (section.path === HOME_PATH) {
        return videos.length;
    }

    if (section.path === "/clips") {
        return videos.reduce((total, video) => total + video.readyClipCount, 0);
    }

    return null;
}

function SectionLinks(): ReactNode {
    const pathname = useLocation({ select: (location) => location.pathname });
    const sections = useNavSections();
    const videosQuery = useVideosQuery();
    const videos = videosQuery.data ?? [];

    return (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-0.5">
            {sections.map((section) => {
                const state = getSectionState(section, pathname);
                const count = countFor(section, videos);

                return (
                    <li key={section.path}>
                        <Link
                            to={section.path}
                            aria-current={toAriaCurrent(state === "current")}
                            className={SIDEBAR_ITEM_CLASS}
                        >
                            <SectionIcon section={section} state={state} />
                            <span className="flex-1">{section.label}</span>
                            {count !== null && count > 0 && (
                                <span className="text-sm text-muted-foreground tabular-nums">
                                    {count}
                                </span>
                            )}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

/**
 * The sidebar on the window frame. Lines: boxes 12px in, icon column centred at 34, labels at 56,
 * trailing 12px in. Section titles start on the icon column's leading edge (24).
 */
export function AppSidebar(): ReactNode {
    const [query, setQuery] = useState("");

    return (
        <div className="flex h-full min-h-0 flex-col px-3 pb-3">
            <SearchField
                label="Buscar vídeo"
                placeholder="Buscar"
                value={query}
                onValueChange={setQuery}
                className="sm:w-full"
            />
            <nav aria-label="Seções" className="pt-3">
                <SectionLinks />
            </nav>
            <div className="-mx-3 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
                <SidebarVideos query={query} />
            </div>
            <AccountMenuButton />
        </div>
    );
}
