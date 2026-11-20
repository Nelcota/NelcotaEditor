import { toYoutubeVideoId } from "#/modules/videos/youtube-url";

/** What the person gave the form: a pasted link (possibly still being typed) or a chosen file. */
export type VideoSource = { kind: "link"; text: string } | { kind: "file"; file: File };

export const EMPTY_SOURCE: VideoSource = { kind: "link", text: "" };

/** The YouTube id behind a pasted link; null for a file or a link that is not a YouTube video. */
export function toLinkVideoId(source: VideoSource): string | null {
    if (source.kind === "file") {
        return null;
    }

    return toYoutubeVideoId(source.text.trim());
}

export function hasUsableSource(source: VideoSource): boolean {
    if (source.kind === "file") {
        return true;
    }

    return toLinkVideoId(source) !== null;
}
