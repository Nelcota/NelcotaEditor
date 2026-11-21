import ChartNoAxesColumnIcon from "~icons/lucide/chart-no-axes-column";
import ScissorsIcon from "~icons/lucide/scissors";
import SquarePlayIcon from "~icons/lucide/square-play";
import ShieldIcon from "~icons/lucide/shield";
import UserIcon from "~icons/lucide/user";
import type { IconComponent } from "#/shared/ui/icon-component";

export type SectionPath = "/" | "/clips" | "/overview" | "/admin" | "/account";

export interface NavSection {
    path: SectionPath;
    label: string;
    icon: IconComponent;
}

/**
 * "current" is the page you are on; "parent" is the section a deeper page belongs to (Vídeos while
 * a video is open), so the navigation still says where you are.
 */
export type NavSectionState = "current" | "parent" | "none";

export const HOME_PATH = "/";
const VIDEO_PAGE_PREFIX = "/videos/";
const ADMIN_PATH = "/admin";

export const NAV_SECTIONS: ReadonlyArray<NavSection> = [
    { path: HOME_PATH, label: "Vídeos", icon: SquarePlayIcon },
    { path: "/clips", label: "Cortes", icon: ScissorsIcon },
    { path: "/overview", label: "Painel", icon: ChartNoAxesColumnIcon },
];

/** Shown to admins only; the admin routes and server functions check the role on their own. */
export const ADMIN_SECTION: NavSection = {
    path: ADMIN_PATH,
    label: "Admin",
    icon: ShieldIcon,
};

/** Phones only: the sidebar's account menu becomes the last tab. */
export const ACCOUNT_SECTION: NavSection = {
    path: "/account",
    label: "Conta",
    icon: UserIcon,
};

export function getSectionState(section: NavSection, pathname: string): NavSectionState {
    if (pathname === section.path) {
        return "current";
    }

    if (section.path === HOME_PATH && pathname.startsWith(VIDEO_PAGE_PREFIX) === true) {
        return "parent";
    }

    if (section.path === ADMIN_PATH && pathname.startsWith(`${ADMIN_PATH}/`) === true) {
        return "parent";
    }

    return "none";
}
