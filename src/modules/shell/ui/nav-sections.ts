import Chart2Icon from "~icons/solar/chart-2-linear";
import ClapperboardPlayIcon from "~icons/solar/clapperboard-play-linear";
import ShieldUserIcon from "~icons/solar/shield-user-linear";
import UserRoundedIcon from "~icons/solar/user-rounded-linear";
import VideoLibraryIcon from "~icons/solar/video-library-linear";
import type { IconComponent } from "#/shared/ui/icon-component";

export type SectionPath = "/" | "/clips" | "/overview" | "/admin" | "/account";

export interface NavSection {
    path: SectionPath;
    label: string;
    icon: IconComponent;
}

/**
 * "current" is the page you are on; "parent" is the section a deeper page belongs to (Vídeos while
 * a video is open), so the rail still says where you are.
 */
export type NavSectionState = "current" | "parent" | "none";

export const HOME_PATH = "/";
const VIDEO_PAGE_PREFIX = "/videos/";
const ADMIN_PATH = "/admin";

export const NAV_SECTIONS: ReadonlyArray<NavSection> = [
    { path: HOME_PATH, label: "Vídeos", icon: VideoLibraryIcon },
    { path: "/clips", label: "Cortes", icon: ClapperboardPlayIcon },
    { path: "/overview", label: "Painel", icon: Chart2Icon },
];

/** Shown to admins only; the admin routes and server functions check the role on their own. */
export const ADMIN_SECTION: NavSection = { path: ADMIN_PATH, label: "Admin", icon: ShieldUserIcon };

/** Phones only: the rail's account menu becomes the last tab. */
export const ACCOUNT_SECTION: NavSection = {
    path: "/account",
    label: "Conta",
    icon: UserRoundedIcon,
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
