import MagniferIcon from "~icons/solar/magnifer-linear";
import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { AccountMenuButton } from "#/modules/auth/ui/account-menu-button";
import { HOME_PATH, getSectionState } from "#/modules/shell/ui/nav-sections";
import type { NavSection } from "#/modules/shell/ui/nav-sections";
import { useNavSections } from "#/modules/shell/ui/use-nav-sections";
import type { VideoSummary } from "#/modules/videos/video-views";
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
                const Icon = section.icon;
                const count = countFor(section, videos);

                return (
                    <li key={section.path}>
                        <Link
                            to={section.path}
                            aria-current={toAriaCurrent(
                                getSectionState(section, pathname) === "current",
                            )}
                            className={SIDEBAR_ITEM_CLASS}
                        >
                            <Icon aria-hidden="true" />
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

/** Finds a video by name; the lists under it narrow as you type. */
function SidebarSearch({
    query,
    onQueryChange,
}: {
    query: string;
    onQueryChange: (query: string) => void;
}) {
    return (
        <label className="flex h-11 items-center gap-3 rounded-xl border border-border bg-foreground/[0.04] px-[11px] text-muted-foreground transition-colors focus-within:bg-background focus-within:ring-4 focus-within:ring-ring/70 hover:bg-foreground/[0.06]">
            <MagniferIcon aria-hidden="true" className="size-5 shrink-0" />
            <span className="sr-only">Buscar vídeo</span>
            <input
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Buscar"
                className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
        </label>
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
            <SidebarSearch query={query} onQueryChange={setQuery} />
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
