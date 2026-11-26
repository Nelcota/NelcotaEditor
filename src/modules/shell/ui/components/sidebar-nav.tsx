import ChevronDownIcon from "~icons/lucide/chevron-down";
import { Link, getRouteApi, useLocation } from "@tanstack/react-router";
import { useId, useState } from "react";
import type { ReactNode } from "react";
import {
    ADMIN_SECTION,
    ADMIN_SUB_SECTIONS,
    EDITS_SECTION,
    GENERAL_NAV_GROUP,
    GETTING_STARTED_SECTION,
    SECTION_LINK_ACTIVE_OPTIONS,
    SUPPORT_SECTION,
    WORK_NAV_GROUPS,
    getSectionState,
    isAdminSubSectionCurrent,
} from "#/modules/shell/model/nav-sections";
import type { NavGroup, NavSection } from "#/modules/shell/model/nav-sections";
import { SIDEBAR_ITEM_CLASS } from "#/modules/shell/ui/components/sidebar-item-class";
import { useGettingStartedChecklist } from "#/modules/shell/ui/hooks/use-getting-started-checklist";
import { useQuery } from "@tanstack/react-query";
import { supportWaitingQueryOptions } from "#/modules/admin/model/admin-queries";
import { supportReplyQueryOptions } from "#/modules/support/model/support-queries";
import { myEditSessionsQueryOptions } from "#/modules/viral-formats/model/edit-session-queries";
import { cn } from "#/shared/ui/cn";
import { toAriaCurrent } from "#/shared/ui/to-aria-current";

const appRoute = getRouteApi("/_app");

/** The newest batches under Minhas edições; the page lists the rest. */
const MAX_SIDEBAR_SESSIONS = 5;

// The line runs down the icon column (33px), so the rows read as the section's own.
const SUB_LIST_CLASS =
    "relative mt-0.5 grid gap-0.5 ps-8 before:absolute before:inset-y-1 before:start-[1.375rem] before:w-px before:bg-foreground/15 before:content-['']";
const SUB_ITEM_CLASS = cn(SIDEBAR_ITEM_CLASS, "h-10 ps-3.5 font-normal");

interface SectionLinkProps {
    section: NavSection;
    pathname: string;
    /** A mark after the label, such as the dot for an unread answer. */
    trailing?: ReactNode;
}

function SectionLink({ section, pathname, trailing }: SectionLinkProps): ReactNode {
    const state = getSectionState(section, pathname);
    const Icon = section.icon;

    return (
        <li>
            <Link
                to={section.path}
                activeOptions={SECTION_LINK_ACTIVE_OPTIONS}
                aria-current={toAriaCurrent(state === "current")}
                data-parent={state === "parent"}
                className={SIDEBAR_ITEM_CLASS}
            >
                <Icon aria-hidden="true" />
                <span className="flex-1 truncate">{section.label}</span>
                {trailing}
            </Link>
        </li>
    );
}

/** Suporte, with a dot while an answer from the team waits unread. */
function SupportLink({ pathname }: { pathname: string }): ReactNode {
    const { data: hasUnreadReply } = useQuery(supportReplyQueryOptions());
    let trailing: ReactNode = null;

    if (hasUnreadReply === true) {
        trailing = (
            <span className="size-2 shrink-0 rounded-full bg-primary">
                <span className="sr-only">Resposta nova</span>
            </span>
        );
    }

    return <SectionLink section={SUPPORT_SECTION} pathname={pathname} trailing={trailing} />;
}

/** Comece por aqui, with how many checklist steps are done ("0/4"); lime once all are. */
function GettingStartedLink({ pathname }: { pathname: string }): ReactNode {
    const { doneCount, totalCount } = useGettingStartedChecklist();
    const trailing = (
        <span
            className={cn(
                "rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-muted-foreground tabular-nums",
                doneCount === totalCount && "bg-primary/15 text-primary-ink",
            )}
        >
            {doneCount}/{totalCount}
            <span className="sr-only"> passos feitos</span>
        </span>
    );

    return (
        <SectionLink section={GETTING_STARTED_SECTION} pathname={pathname} trailing={trailing} />
    );
}

/** How many tickets wait for an answer; nothing when none do. */
function WaitingTicketsBadge(): ReactNode {
    const { data: waitingCount } = useQuery(supportWaitingQueryOptions());

    if (waitingCount === undefined || waitingCount === 0) {
        return null;
    }

    return (
        <span className="rounded-lg bg-primary/20 px-1.5 text-xs font-bold text-primary-ink tabular-nums">
            {waitingCount}
            <span className="sr-only"> esperando resposta</span>
        </span>
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
                <WaitingTicketsBadge />
                <ChevronDownIcon
                    aria-hidden="true"
                    className={cn(
                        "size-4! text-muted-foreground! transition-transform",
                        isOpen === true && "rotate-180",
                    )}
                />
            </button>
            {isOpen === true && (
                <ul id={listId} className={SUB_LIST_CLASS}>
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
                                className={SUB_ITEM_CLASS}
                            >
                                <span className="flex-1">{subSection.label}</span>
                                {subSection.path === "/admin/support" && <WaitingTicketsBadge />}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}

/** Minhas edições, with the person's newest batches under it, like the prototype's tree. */
function EditsLink({ pathname }: { pathname: string }): ReactNode {
    const { data: sessions } = useQuery(myEditSessionsQueryOptions());
    const newestSessions = (sessions ?? []).slice(0, MAX_SIDEBAR_SESSIONS);

    return (
        <>
            <SectionLink section={EDITS_SECTION} pathname={pathname} />
            {newestSessions.length > 0 && (
                <li>
                    <ul aria-label={EDITS_SECTION.label} className={SUB_LIST_CLASS}>
                        {newestSessions.map((session) => (
                            <li key={session.id}>
                                <Link
                                    to="/edits/$sessionId"
                                    params={{ sessionId: session.id }}
                                    className={SUB_ITEM_CLASS}
                                >
                                    <span className="flex-1 truncate">{session.title}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </li>
            )}
        </>
    );
}

/** One link of a group: the ones with a mark or rows of their own get them, the rest are plain. */
function GroupSectionLink({ section, pathname }: { section: NavSection; pathname: string }) {
    if (section === GETTING_STARTED_SECTION) {
        return <GettingStartedLink pathname={pathname} />;
    }

    if (section === SUPPORT_SECTION) {
        return <SupportLink pathname={pathname} />;
    }

    if (section === EDITS_SECTION) {
        return <EditsLink pathname={pathname} />;
    }

    return <SectionLink section={section} pathname={pathname} />;
}

interface SidebarGroupProps {
    group: NavGroup;
    pathname: string;
    /** Extra rows after the group's sections, such as the Admin folder. */
    children?: ReactNode;
}

function SidebarGroup({ group, pathname, children }: SidebarGroupProps): ReactNode {
    const headingId = useId();

    return (
        <div className="grid gap-1">
            <p
                id={headingId}
                className="px-3 text-xs font-bold tracking-eyebrow text-muted-foreground uppercase"
            >
                {group.label}
            </p>
            <ul aria-labelledby={headingId} className="grid grid-cols-[minmax(0,1fr)] gap-0.5">
                {group.sections.map((section) => (
                    <GroupSectionLink key={section.path} section={section} pathname={pathname} />
                ))}
                {children}
            </ul>
        </div>
    );
}

/** The three groups of the Editor Oculto guide; admins also get the Admin folder under Geral. */
export function SidebarNav(): ReactNode {
    const pathname = useLocation({ select: (location) => location.pathname });
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;

    return (
        <nav aria-label="Seções" className="flex min-h-full flex-col justify-between gap-4">
            <div className="grid gap-4">
                {WORK_NAV_GROUPS.map((group) => (
                    <SidebarGroup key={group.label} group={group} pathname={pathname} />
                ))}
            </div>
            <SidebarGroup group={GENERAL_NAV_GROUP} pathname={pathname}>
                {user.isAdmin === true && <AdminGroup pathname={pathname} />}
            </SidebarGroup>
        </nav>
    );
}
