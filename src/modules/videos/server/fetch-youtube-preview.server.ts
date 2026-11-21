import { z } from "zod";
import { toYoutubeThumbnailUrl } from "#/modules/videos/youtube-preview";
import type { YoutubePreview } from "#/modules/videos/youtube-preview";
import { YOUTUBE_VIDEO_ID_PATTERN } from "#/modules/videos/youtube-url";
import { UserFacingError } from "#/shared/server/user-facing-error";
import {
    HTTP_BAD_REQUEST,
    HTTP_FORBIDDEN,
    HTTP_NOT_FOUND,
    HTTP_UNAUTHORIZED,
} from "#/shared/server/http-response";

const OEMBED_ENDPOINT = "https://www.youtube.com/oembed";
const WATCH_URL = "https://www.youtube.com/watch?v=";
const TIMEOUT_MILLISECONDS = 5_000;

const PRIVATE_STATUSES: ReadonlyArray<number> = [HTTP_UNAUTHORIZED, HTTP_FORBIDDEN];
const MISSING_STATUSES: ReadonlyArray<number> = [HTTP_BAD_REQUEST, HTTP_NOT_FOUND];

const UNREACHABLE_MESSAGE = "Não deu para consultar o YouTube agora.";
const UNEXPECTED_ANSWER_MESSAGE = "O YouTube respondeu de um jeito inesperado.";

/** Only the fields we show; YouTube's answer is external data, so it is checked before use. */
const oembedSchema = z.object({
    title: z.string().trim().min(1).max(300),
    // An empty or oversized channel name is shown as no channel instead of "YouTube · ".
    author_name: z.string().trim().min(1).max(200).optional().catch(undefined),
});

type Oembed = z.infer<typeof oembedSchema>;

export class InvalidYoutubeVideoIdError extends Error {
    constructor(videoId: string) {
        super(`Not a YouTube video id: ${videoId}`);
        this.name = "InvalidYoutubeVideoIdError";
    }
}

/** A timeout or network failure is YouTube being unreachable, which the user can retry. */
async function requestOembed(videoId: string): Promise<Response> {
    const watchUrl = `${WATCH_URL}${videoId}`;
    const endpoint = `${OEMBED_ENDPOINT}?format=json&url=${encodeURIComponent(watchUrl)}`;

    try {
        return await fetch(endpoint, { signal: AbortSignal.timeout(TIMEOUT_MILLISECONDS) });
    } catch (error) {
        throw new UserFacingError(UNREACHABLE_MESSAGE, { cause: error });
    }
}

async function readOembed(response: Response): Promise<Oembed> {
    let body: unknown = null;

    try {
        body = await response.json();
    } catch (error) {
        throw new UserFacingError(UNEXPECTED_ANSWER_MESSAGE, { cause: error });
    }

    const parsed = oembedSchema.safeParse(body);

    if (parsed.success === false) {
        throw new UserFacingError(UNEXPECTED_ANSWER_MESSAGE);
    }

    return parsed.data;
}

/**
 * Title and channel of a public video, from YouTube's oEmbed endpoint (no API key, nothing
 * downloaded). Private or removed videos come back as "unavailable" so the dialog can say so.
 */
export async function fetchYoutubePreview(videoId: string): Promise<YoutubePreview> {
    if (YOUTUBE_VIDEO_ID_PATTERN.test(videoId) === false) {
        throw new InvalidYoutubeVideoIdError(videoId);
    }

    const response = await requestOembed(videoId);
    const status = response.status;

    if (PRIVATE_STATUSES.includes(status) === true) {
        return { kind: "unavailable", reason: "private" };
    }

    if (MISSING_STATUSES.includes(status) === true) {
        return { kind: "unavailable", reason: "not-found" };
    }

    if (response.ok === false) {
        throw new UserFacingError(UNREACHABLE_MESSAGE);
    }

    const oembed = await readOembed(response);

    return {
        kind: "found",
        title: oembed.title,
        channel: oembed.author_name ?? null,
        thumbnailUrl: toYoutubeThumbnailUrl(videoId),
    };
}
