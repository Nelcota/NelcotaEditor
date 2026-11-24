import { useLocation } from "@tanstack/react-router";
import { useVideosQuery } from "#/modules/videos/ui/hooks/use-videos-query";

export type CrumbPath = "/" | "/videos" | "/admin" | "/admin/users";

export interface Crumb {
    label: string;
    /** Where the crumb leads; the last crumb is the page itself and has none. */
    to?: CrumbPath;
}

const HOME_CRUMB: Crumb = { label: "Início", to: "/" };
const VIDEOS_CRUMB: Crumb = { label: "Vídeos", to: "/videos" };
const ADMIN_CRUMB: Crumb = { label: "Admin", to: "/admin" };
const VIDEO_PAGE_PATTERN = /^\/videos\/([^/]+)\/?$/;
const ADMIN_USER_PATTERN = /^\/admin\/users\/[^/]+\/?$/;

const FIXED_CRUMBS: Readonly<Record<string, ReadonlyArray<Crumb>>> = {
    "/": [{ label: "Início" }],
    "/videos": [HOME_CRUMB, { label: "Vídeos" }],
    "/clips": [HOME_CRUMB, { label: "Cortes" }],
    "/overview": [HOME_CRUMB, { label: "Painel" }],
    "/account": [HOME_CRUMB, { label: "Conta" }],
    "/admin": [ADMIN_CRUMB, { label: "Visão geral" }],
    "/admin/users": [ADMIN_CRUMB, { label: "Usuários" }],
    "/admin/videos": [ADMIN_CRUMB, { label: "Vídeos" }],
};

/** "/videos/" and "/videos" are the same page. */
function trimTrailingSlash(pathname: string): string {
    if (pathname.length > 1 && pathname.endsWith("/") === true) {
        return pathname.slice(0, -1);
    }

    return pathname;
}

/** The trail at the top of the panel, from the address; a video's crumb is its title. */
export function useBreadcrumbs(): ReadonlyArray<Crumb> {
    const pathname = trimTrailingSlash(useLocation({ select: (location) => location.pathname }));
    const videosQuery = useVideosQuery();
    const fixed = FIXED_CRUMBS[pathname];

    if (fixed !== undefined) {
        return fixed;
    }

    const videoMatch = VIDEO_PAGE_PATTERN.exec(pathname);

    if (videoMatch !== null) {
        const videos = videosQuery.data ?? [];
        const video = videos.find((candidate) => candidate.id === videoMatch[1]);

        return [VIDEOS_CRUMB, { label: video?.title ?? "Vídeo" }];
    }

    if (ADMIN_USER_PATTERN.test(pathname) === true) {
        return [ADMIN_CRUMB, { label: "Usuários", to: "/admin/users" }, { label: "Conta" }];
    }

    return [HOME_CRUMB];
}
