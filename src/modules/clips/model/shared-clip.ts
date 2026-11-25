import { z } from "zod";
import type { AspectRatio } from "#/modules/clips/model/clip-format";

// 24 random bytes in base64url are always 32 characters.
export const shareTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{32}$/);

/** What the public page of a shared clip shows and its link preview describes. */
export interface SharedClip {
    title: string;
    aspectRatio: AspectRatio;
    durationSeconds: number;
    /** What the page's own player loads, from the address the page was opened at. */
    videoPath: string;
    /** Absolute links: link previews do not resolve relative ones. */
    pageUrl: string;
    videoUrl: string;
    /** Null for clips rendered before posters existed; the preview falls back to the app's image. */
    posterUrl: string | null;
}

export function toSharedClipPagePath(shareToken: string): string {
    return `/c/${shareToken}`;
}

export function toSharedClipFilePath(shareToken: string): string {
    return `/api/share/${shareToken}`;
}

export function toSharedClipPosterPath(shareToken: string): string {
    return `/api/share/${shareToken}/poster`;
}
