/**
 * Every origin the app loads from, mapped on 2026-11-21:
 * - YouTube thumbnails (i.ytimg.com) before a video has a frame of its own.
 * - Google Fonts: the stylesheet from fonts.googleapis.com, the files from fonts.gstatic.com.
 * - Cloudflare Turnstile: its script and the iframe it renders, both on challenges.cloudflare.com.
 * - blob: for the local preview of a file about to be uploaded; data: for inline images and fonts.
 */
const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";
const YOUTUBE_THUMBNAIL_ORIGIN = "https://i.ytimg.com";
const GOOGLE_FONTS_STYLESHEET_ORIGIN = "https://fonts.googleapis.com";
const GOOGLE_FONTS_FILE_ORIGIN = "https://fonts.gstatic.com";

interface PolicyOptions {
    /** Per-request nonce TanStack Start puts on every inline script it renders. */
    nonce: string;
    /** Vite's dev server talks to the page over a websocket for hot reload. */
    isDevelopment: boolean;
    /** Where videos, thumbnails and photos load from, and uploads go to, when the store is not the app (R2). */
    storageMediaOrigin: string | null;
}

function withStorageOrigin(sources: string, storageMediaOrigin: string | null): string {
    if (storageMediaOrigin === null) {
        return sources;
    }

    return `${sources} ${storageMediaOrigin}`;
}

function buildConnectSources(isDevelopment: boolean): string {
    if (isDevelopment === true) {
        return "'self' ws: wss:";
    }

    return "'self'";
}

/**
 * Scripts need the nonce: SSR emits inline scripts (hydration data, router bootstrap) and those
 * carry it, so 'unsafe-inline' is not needed. Styles keep 'unsafe-inline': React renders `style`
 * attributes (positions, sizes, colors in the Studio) and no nonce can cover an attribute.
 */
export function buildContentSecurityPolicy(options: PolicyOptions): string {
    const storageMediaOrigin = options.storageMediaOrigin;
    const directives = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${options.nonce}' ${TURNSTILE_ORIGIN}`,
        `style-src 'self' 'unsafe-inline' ${GOOGLE_FONTS_STYLESHEET_ORIGIN}`,
        `font-src 'self' data: ${GOOGLE_FONTS_FILE_ORIGIN}`,
        `img-src ${withStorageOrigin(`'self' data: blob: ${YOUTUBE_THUMBNAIL_ORIGIN}`, storageMediaOrigin)}`,
        `media-src ${withStorageOrigin("'self' blob:", storageMediaOrigin)}`,
        // The browser PUTs uploads straight to the store.
        `connect-src ${withStorageOrigin(buildConnectSources(options.isDevelopment), storageMediaOrigin)}`,
        `frame-src ${TURNSTILE_ORIGIN}`,
        "worker-src 'self' blob:",
        "manifest-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ];

    return directives.join("; ");
}
