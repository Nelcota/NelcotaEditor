import { z } from "zod";

const YOUTUBE_HOSTS: ReadonlyArray<string> = [
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
];

function isYoutubeUrl(value: string): boolean {
    const url = URL.parse(value);

    if (url === null) {
        return false;
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
        return false;
    }

    return YOUTUBE_HOSTS.includes(url.hostname.toLowerCase());
}

// Real watch links are under 200 characters; this only stops absurd input before it reaches yt-dlp.
const MAX_YOUTUBE_URL_LENGTH = 2048;

/** Only YouTube links are accepted, so the worker never downloads from arbitrary hosts. */
export const youtubeUrlSchema = z
    .string()
    .trim()
    .min(1, "Cole o link do vídeo.")
    .max(MAX_YOUTUBE_URL_LENGTH, "Esse link está longo demais.")
    .refine(isYoutubeUrl, "Use um link do YouTube (youtube.com ou youtu.be).");

/** Every YouTube video id is 11 characters of letters, digits, "-" and "_". */
export const YOUTUBE_VIDEO_ID_PATTERN = /^[\w-]{11}$/;
const PATH_ID_PREFIXES: ReadonlyArray<string> = ["shorts", "live", "embed"];

function readIdFromPath(url: URL): string | null {
    const segments = url.pathname.split("/").filter((segment) => segment.length > 0);

    if (url.hostname.toLowerCase() === "youtu.be") {
        return segments[0] ?? null;
    }

    const prefix = segments[0];

    if (prefix !== undefined && PATH_ID_PREFIXES.includes(prefix) === true) {
        return segments[1] ?? null;
    }

    return null;
}

/** The 11-character id of a YouTube link (watch, youtu.be, shorts, live, embed), or null. */
/** The plain watch link of a video: drops playlist, timestamp and tracking parameters. */
export function toCanonicalYoutubeUrl(value: string): string {
    const videoId = toYoutubeVideoId(value);

    if (videoId === null) {
        throw new Error(`Not a YouTube video link: ${value.slice(0, 80)}`);
    }

    return `https://www.youtube.com/watch?v=${videoId}`;
}

export function toYoutubeVideoId(value: string): string | null {
    const url = URL.parse(value);

    if (url === null || isYoutubeUrl(value) === false) {
        return null;
    }

    const candidate = url.searchParams.get("v") ?? readIdFromPath(url);

    if (candidate === null || YOUTUBE_VIDEO_ID_PATTERN.test(candidate) === false) {
        return null;
    }

    return candidate;
}

/** Why a pasted text cannot be used, in words the person can act on; null when it can. */
export function describeYoutubeLinkProblem(value: string): string | null {
    const trimmed = value.trim();

    if (trimmed.length === 0 || toYoutubeVideoId(trimmed) !== null) {
        return null;
    }

    if (isYoutubeUrl(trimmed) === false) {
        return "Use um link do YouTube (youtube.com ou youtu.be) ou envie um arquivo.";
    }

    const url = URL.parse(trimmed);

    if (url !== null && url.searchParams.has("list") === true) {
        return "Isso é uma playlist. Abra um vídeo dela e cole o link dele.";
    }

    return "Esse link não leva a um vídeo. Abra o vídeo no YouTube e copie o link dele.";
}
