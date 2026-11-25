import ChartNoAxesColumnIcon from "~icons/lucide/chart-no-axes-column";
import CircleHelpIcon from "~icons/lucide/circle-help";
import HouseIcon from "~icons/lucide/house";
import ScissorsIcon from "~icons/lucide/scissors";
import ShieldIcon from "~icons/lucide/shield";
import SquarePlayIcon from "~icons/lucide/square-play";
import UserRoundIcon from "~icons/lucide/user-round";
import type { ActiveOptions } from "@tanstack/react-router";
import type { IconComponent } from "#/shared/ui/icon-component";

export type SectionPath =
    | "/"
    | "/getting-started"
    | "/videos"
    | "/clips"
    | "/overview"
    | "/account"
    | "/support"
    | "/admin";

export interface NavSection {
    path: SectionPath;
    label: string;
    icon: IconComponent;
}

export type AdminSubPath =
    | "/admin"
    | "/admin/users"
    | "/admin/videos"
    | "/admin/support"
    | "/admin/features";

export interface AdminSubSection {
    path: AdminSubPath;
    label: string;
}

/**
 * "current" is the page you are on; "parent" is the section a deeper page belongs to (Vídeos while
 * a video is open), so the navigation still says where you are.
 */
export type NavSectionState = "current" | "parent" | "none";

/**
 * The router sets aria-current="page" on every active link, over our own value, and by default a
 * link is active on every page under its path (Vídeos on an open video). Only the page itself is
 * current, whatever its search; the section of a deeper page is styled through data-parent.
 */
export const SECTION_LINK_ACTIVE_OPTIONS = {
    exact: true,
    includeSearch: false,
} as const satisfies ActiveOptions;

export const HOME_PATH = "/";
export const VIDEOS_PATH = "/videos";
const ADMIN_PATH = "/admin";

export const NAV_SECTIONS: ReadonlyArray<NavSection> = [
    { path: HOME_PATH, label: "Início", icon: HouseIcon },
    { path: VIDEOS_PATH, label: "Vídeos", icon: SquarePlayIcon },
    { path: "/clips", label: "Cortes", icon: ScissorsIcon },
    { path: "/overview", label: "Painel", icon: ChartNoAxesColumnIcon },
    { path: "/account", label: "Conta", icon: UserRoundIcon },
];

/** Kept apart from the work sections, at the foot of the list, and off the phone tab bar. */
export const SUPPORT_SECTION: NavSection = {
    path: "/support",
    label: "Suporte",
    icon: CircleHelpIcon,
};

/** Shown to admins only; the admin routes and server functions check the role on their own. */
export const ADMIN_SECTION: NavSection = {
    path: ADMIN_PATH,
    label: "Admin",
    icon: ShieldIcon,
};

/** The admin pages, listed under Admin when it is open in the sidebar. */
export const ADMIN_SUB_SECTIONS: ReadonlyArray<AdminSubSection> = [
    { path: "/admin", label: "Visão geral" },
    { path: "/admin/users", label: "Usuários" },
    { path: "/admin/videos", label: "Vídeos" },
    { path: "/admin/support", label: "Suporte" },
    { path: "/admin/features", label: "Recursos" },
];

/** Every section fits the phone tab bar; Admin stays a desktop page. */
export const PHONE_SECTIONS: ReadonlyArray<NavSection> = NAV_SECTIONS;

/** A path and every page under it ("/videos" holds "/videos/abc"). */
function isUnder(pathname: string, path: string): boolean {
    return pathname.startsWith(`${path}/`);
}

export function getSectionState(section: NavSection, pathname: string): NavSectionState {
    const path = section.path;

    if (pathname === path || pathname === `${path}/`) {
        return "current";
    }

    if (path !== HOME_PATH && isUnder(pathname, path) === true) {
        return "parent";
    }

    return "none";
}

export function isAdminSubSectionCurrent(subSection: AdminSubSection, pathname: string): boolean {
    const path = subSection.path;

    if (path === ADMIN_PATH) {
        return pathname === ADMIN_PATH || pathname === `${ADMIN_PATH}/`;
    }

    return pathname === path || isUnder(pathname, path) === true;
}
