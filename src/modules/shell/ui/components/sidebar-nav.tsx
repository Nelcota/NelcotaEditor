import ChevronDownIcon from "~icons/lucide/chevron-down";
import { Link, getRouteApi, useLocation } from "@tanstack/react-router";
import { useId, useState } from "react";
import type { ReactNode } from "react";
import {
    ADMIN_SECTION,
    ADMIN_SUB_SECTIONS,
    NAV_SECTIONS,
    VIDEOS_PATH,
    getSectionState,
    isAdminSubSectionCurrent,
} from "#/modules/shell/model/nav-sections";
import type { NavSection } from "#/modules/shell/model/nav-sections";
import { SIDEBAR_ITEM_CLASS } from "#/modules/shell/ui/components/sidebar-item-class";
import { useQuery } from "@tanstack/react-query";
import { videosQueryOptions } from "#/modules/videos/model/video-queries";
import { cn } from "#/shared/ui/cn";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";

const appRoute = getRouteApi("/_app");

/** The count beside Vídeos; nothing elsewhere, so the numbers keep one meaning. */
function useVideoCount(section: NavSection): number | null {
    const videosQuery = useQuery(videosQueryOptions());
    const videos = videosQuery.data;

    if (section.path !== VIDEOS_PATH || videos === undefined || videos.length === 0) {
        return null;
    }

    return videos.length;
}

function SectionLink({ section, pathname }: { section: NavSection; pathname: string }): ReactNode {
    const state = getSectionState(section, pathname);
    const count = useVideoCount(section);
    const Icon = section.icon;

    return (
        <li>
            <Link
                to={section.path}
                aria-current={toAriaCurrent(state === "current")}
                data-parent={state === "parent"}
                className={SIDEBAR_ITEM_CLASS}
            >
                <Icon aria-hidden="true" />
                <span className="flex-1 truncate">{section.label}</span>
                {count !== null && (
                    <span className="text-sm font-normal text-muted-foreground tabular-nums">
                        {count}
                    </span>
                )}
            </Link>
        </li>
    );
}

/** Admin opens like a folder, listing its pages; it starts open while you are in one of them. */
function AdminGroup({ pathname }: { pathname: string }): ReactNode {
    const listId = useId();
    const isInAdmin = getSectionState(ADMIN_SECTION, pathname) !== "none";
    const [isOpen, setIsOpen] = useState(isInAdmin);
    const Icon = ADMIN_SECTION.icon;

    return (
        <li>
            <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={listId}
                onClick={() => setIsOpen(isOpen === false)}
                className={SIDEBAR_ITEM_CLASS}
            >
                <Icon aria-hidden="true" />
                <span className="flex-1 text-start">{ADMIN_SECTION.label}</span>
                <ChevronDownIcon
                    aria-hidden="true"
                    className={cn(
                        "size-4! text-muted-foreground! transition-transform",
                        isOpen === true && "rotate-180",
                    )}
                />
            </button>
            {isOpen === true && (
                // The line runs down the icon column (33px), so the pages read as Admin's own.
                <ul
                    id={listId}
                    className="relative mt-0.5 grid gap-0.5 ps-8 before:absolute before:inset-y-1 before:start-[1.375rem] before:w-px before:bg-foreground/15 before:content-['']"
                >
                    {ADMIN_SUB_SECTIONS.map((subSection) => (
                        <li key={subSection.path}>
                            <Link
                                to={subSection.path}
                                // Exact: by default the router marks /admin current on every
                                // admin page, which lit Visão geral next to the real one.
                                activeOptions={{ exact: true }}
                                aria-current={toAriaCurrent(
                                    isAdminSubSectionCurrent(subSection, pathname),
                                )}
                                className={cn(SIDEBAR_ITEM_CLASS, "h-10 ps-3.5 font-normal")}
                            >
                                {subSection.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}

/** The sections, in the reference's order; admins also get the Admin folder. */
export function SidebarNav(): ReactNode {
    const pathname = useLocation({ select: (location) => location.pathname });
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;

    return (
        <nav aria-label="Seções">
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-0.5">
                {NAV_SECTIONS.map((section) => (
                    <SectionLink key={section.path} section={section} pathname={pathname} />
                ))}
                {user.isAdmin === true && <AdminGroup pathname={pathname} />}
            </ul>
        </nav>
    );
}
