/** What the dialog shows right after a link is pasted, before anything is downloaded. */
export type YoutubePreview =
    | { kind: "found"; title: string; channel: string | null; thumbnailUrl: string }
    | { kind: "unavailable"; reason: "private" | "not-found" };

export function toYoutubeThumbnailUrl(videoId: string): string {
    return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}
