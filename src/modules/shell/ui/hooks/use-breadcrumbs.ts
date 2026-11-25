import { useLocation } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import type { VideoDetails } from "#/modules/videos/model/video-views";
import { videoDetailsQueryOptions } from "#/modules/videos/model/video-queries";

export type CrumbPath =
    | "/getting-started"
    | "/clips-getting-started"
    | "/clips"
    | "/videos"
    | "/admin"
    | "/admin/users"
    | "/support"
    | "/admin/support";

export interface Crumb {
    label: string;
    /** Where the crumb leads; the last crumb is the page itself and has none. */
    to?: CrumbPath;
}

/** Each area's trail starts at its own "Comece por aqui". */
const EDITOR_CRUMB: Crumb = { label: "Editor Oculto", to: "/getting-started" };
const CLIPS_AREA_CRUMB: Crumb = { label: "Cortes", to: "/clips-getting-started" };
const MY_CLIPS_CRUMB: Crumb = { label: "Meus cortes", to: "/clips" };
const VIDEOS_CRUMB: Crumb = { label: "Vídeos", to: "/videos" };
const ADMIN_CRUMB: Crumb = { label: "Admin", to: "/admin" };
const SUPPORT_CRUMB: Crumb = { label: "Suporte", to: "/support" };
const ADMIN_SUPPORT_CRUMB: Crumb = { label: "Suporte", to: "/admin/support" };
const TICKET_PAGE_PATTERN = /^\/support\/[^/]+\/?$/;
const ADMIN_TICKET_PATTERN = /^\/admin\/support\/[^/]+\/?$/;
const VIDEO_PAGE_PATTERN = /^\/videos\/([^/]+)\/?$/;
const ADMIN_USER_PATTERN = /^\/admin\/users\/[^/]+\/?$/;

const FIXED_CRUMBS: Readonly<Record<string, ReadonlyArray<Crumb>>> = {
    "/getting-started": [EDITOR_CRUMB, { label: "Comece por aqui" }],
    "/claude": [EDITOR_CRUMB, { label: "Etapa 1 · Conectar Claude" }],
    "/formats": [EDITOR_CRUMB, { label: "Formatos Virais" }],
    "/edits": [EDITOR_CRUMB, { label: "Minhas edições" }],
    "/clips-getting-started": [CLIPS_AREA_CRUMB, { label: "Comece por aqui" }],
    "/clips": [CLIPS_AREA_CRUMB, { label: "Meus cortes" }],
    "/videos": [CLIPS_AREA_CRUMB, MY_CLIPS_CRUMB, { label: "Vídeos" }],
    "/overview": [CLIPS_AREA_CRUMB, { label: "Painel" }],
    "/account": [{ label: "Conta" }],
    // Old addresses that redirect to Conta; the trail names where they lead while that happens.
    "/preferences": [{ label: "Conta" }],
    "/usage": [{ label: "Conta" }],
    "/admin": [ADMIN_CRUMB, { label: "Visão geral" }],
    "/admin/users": [ADMIN_CRUMB, { label: "Usuários" }],
    "/admin/videos": [ADMIN_CRUMB, { label: "Vídeos" }],
    "/admin/features": [ADMIN_CRUMB, { label: "Recursos" }],
    "/admin/support": [ADMIN_CRUMB, { label: "Suporte" }],
    "/support": [{ label: "Suporte" }],
    "/support/new": [SUPPORT_CRUMB, { label: "Nova conversa" }],
};

/** "/videos/" and "/videos" are the same page. */
function trimTrailingSlash(pathname: string): string {
    if (pathname.length > 1 && pathname.endsWith("/") === true) {
        return pathname.slice(0, -1);
    }

    return pathname;
}

function readCachedDetails(
    queryClient: QueryClient,
    videoId: string | null,
): VideoDetails | undefined {
    if (videoId === null) {
        return undefined;
    }

    return queryClient.getQueryData(videoDetailsQueryOptions(videoId).queryKey);
}

/**
 * The open video's title, from the page's own cached details. Never fetched here: the video page
 * loads them, and a malformed id in the address must not reach the server. Read from the cache
 * without an observer, which would add an empty entry for every page that is not a video.
 */
function useVideoTitle(videoId: string | null): string | null {
    const queryClient = useQueryClient();
    const queryCache = queryClient.getQueryCache();
    const readDetails = (): VideoDetails | undefined => readCachedDetails(queryClient, videoId);
    const details = useSyncExternalStore(
        (onCacheChange) => queryCache.subscribe(onCacheChange),
        readDetails,
        readDetails,
    );

    if (details === undefined) {
        return null;
    }

    return details.video.title;
}
/** The trail at the top of the panel, from the address; a video's crumb is its title. */
export function useBreadcrumbs(): ReadonlyArray<Crumb> {
    const pathname = trimTrailingSlash(useLocation({ select: (location) => location.pathname }));
    const videoMatch = VIDEO_PAGE_PATTERN.exec(pathname);
    const videoTitle = useVideoTitle(videoMatch?.[1] ?? null);
    const fixed = FIXED_CRUMBS[pathname];

    if (fixed !== undefined) {
        return fixed;
    }

    if (videoMatch !== null) {
        return [MY_CLIPS_CRUMB, VIDEOS_CRUMB, { label: videoTitle ?? "Vídeo" }];
    }

    if (ADMIN_TICKET_PATTERN.test(pathname) === true) {
        return [ADMIN_CRUMB, ADMIN_SUPPORT_CRUMB, { label: "Ticket" }];
    }

    if (TICKET_PAGE_PATTERN.test(pathname) === true) {
        return [SUPPORT_CRUMB, { label: "Conversa" }];
    }

    if (ADMIN_USER_PATTERN.test(pathname) === true) {
        return [ADMIN_CRUMB, { label: "Usuários", to: "/admin/users" }, { label: "Conta" }];
    }

    // Any other address is the catch-all 404 page.
    return [{ label: "Página não encontrada" }];
}
