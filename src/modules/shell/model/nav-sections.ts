import ChartNoAxesColumnIcon from "~icons/lucide/chart-no-axes-column";
import CircleHelpIcon from "~icons/lucide/circle-help";
import ClapperboardIcon from "~icons/lucide/clapperboard";
import LayersIcon from "~icons/lucide/layers";
import PlayIcon from "~icons/lucide/play";
import ScissorsIcon from "~icons/lucide/scissors";
import ShieldIcon from "~icons/lucide/shield";
import UserRoundIcon from "~icons/lucide/user-round";
import type { ActiveOptions } from "@tanstack/react-router";
import { ClaudeLogo } from "#/shared/ui/claude-logo";
import type { IconComponent } from "#/shared/ui/icon-component";

export type SectionPath =
    | "/getting-started"
    | "/claude"
    | "/formats"
    | "/edits"
    | "/clips-getting-started"
    | "/clips"
    | "/overview"
    | "/account"
    | "/support"
    | "/admin";

export interface NavSection {
    path: SectionPath;
    label: string;
    icon: IconComponent;
    /** A name that fits the phone tab bar, part of the full one so voice control still finds it. */
    shortLabel?: string;
    /** Pages that live elsewhere in the address but belong to this section (a video, in Meus cortes). */
    childPaths?: ReadonlyArray<string>;
}

export interface NavGroup {
    label: string;
    sections: ReadonlyArray<NavSection>;
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
 * "current" is the page you are on; "parent" is the section a deeper page belongs to (Meus cortes
 * while a video is open), so the navigation still says where you are.
 */
export type NavSectionState = "current" | "parent" | "none";

/**
 * The router sets aria-current="page" on every active link, over our own value, and by default a
 * link is active on every page under its path. Only the page itself is current, whatever its
 * search; the section of a deeper page is styled through data-parent.
 */
export const SECTION_LINK_ACTIVE_OPTIONS = {
    exact: true,
    includeSearch: false,
} as const satisfies ActiveOptions;

export const START_PATH = "/getting-started";
export const CLIPS_PATH = "/clips";
const ADMIN_PATH = "/admin";

export const GETTING_STARTED_SECTION: NavSection = {
    path: START_PATH,
    label: "Comece por aqui",
    shortLabel: "Comece",
    icon: PlayIcon,
};

export const CLAUDE_SECTION: NavSection = {
    path: "/claude",
    label: "Etapa 1 · Conectar Claude",
    icon: ClaudeLogo,
};

export const FORMATS_SECTION: NavSection = {
    path: "/formats",
    label: "Formatos Virais",
    shortLabel: "Formatos",
    icon: ClapperboardIcon,
};

export const EDITS_SECTION: NavSection = {
    path: "/edits",
    label: "Minhas edições",
    icon: LayersIcon,
};

export const CLIPS_GETTING_STARTED_SECTION: NavSection = {
    path: "/clips-getting-started",
    label: "Comece por aqui",
    icon: PlayIcon,
};

export const CLIPS_SECTION: NavSection = {
    path: CLIPS_PATH,
    label: "Meus cortes",
    shortLabel: "Cortes",
    icon: ScissorsIcon,
    childPaths: ["/videos"],
};

export const OVERVIEW_SECTION: NavSection = {
    path: "/overview",
    label: "Painel",
    icon: ChartNoAxesColumnIcon,
};

export const ACCOUNT_SECTION: NavSection = {
    path: "/account",
    label: "Conta",
    icon: UserRoundIcon,
};

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

/** The sidebar, as in the Editor Oculto guide: each area starts with its own "Comece por aqui". */
export const NAV_GROUPS: ReadonlyArray<NavGroup> = [
    {
        label: "Editor Oculto",
        sections: [GETTING_STARTED_SECTION, CLAUDE_SECTION, FORMATS_SECTION, EDITS_SECTION],
    },
    { label: "Cortes", sections: [CLIPS_GETTING_STARTED_SECTION, CLIPS_SECTION, OVERVIEW_SECTION] },
    { label: "Geral", sections: [ACCOUNT_SECTION, SUPPORT_SECTION] },
];

export const NAV_SECTIONS: ReadonlyArray<NavSection> = NAV_GROUPS.flatMap(
    (group) => group.sections,
);

/** The admin pages, listed under Admin when it is open in the sidebar. */
export const ADMIN_SUB_SECTIONS: ReadonlyArray<AdminSubSection> = [
    { path: "/admin", label: "Visão geral" },
    { path: "/admin/users", label: "Usuários" },
    { path: "/admin/videos", label: "Vídeos" },
    { path: "/admin/support", label: "Suporte" },
    { path: "/admin/features", label: "Recursos" },
];

/** Five fit the phone tab bar: where each area starts and where the work happens. */
export const PHONE_SECTIONS: ReadonlyArray<NavSection> = [
    GETTING_STARTED_SECTION,
    FORMATS_SECTION,
    CLIPS_SECTION,
    OVERVIEW_SECTION,
    ACCOUNT_SECTION,
];

/** A path and every page under it ("/videos" holds "/videos/abc"). */
function isUnder(pathname: string, path: string): boolean {
    return pathname === path || pathname.startsWith(`${path}/`);
}

export function getSectionState(section: NavSection, pathname: string): NavSectionState {
    const path = section.path;
    const childPaths = section.childPaths ?? [];

    if (pathname === path || pathname === `${path}/`) {
        return "current";
    }

    if (isUnder(pathname, path) === true) {
        return "parent";
    }

    if (childPaths.some((childPath) => isUnder(pathname, childPath)) === true) {
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
