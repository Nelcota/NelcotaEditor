import { toClipPosterSize } from "#/modules/clips/model/clip-poster-size";
import { ASPECT_RATIO_SIZES } from "#/modules/clips/model/clip-format";
import type { SharedClip } from "#/modules/clips/model/shared-clip";

const SHARED_CLIP_DESCRIPTION = "Corte com legenda feito no Nelcota.";

type HeadMeta =
    | { title: string }
    | { name: string; content: string }
    | { property: string; content: string };

function buildPosterMeta(clip: SharedClip): Array<HeadMeta> {
    const posterUrl = clip.posterUrl;

    // Without a poster, the app's own image from the root stays as the preview.
    if (posterUrl === null) {
        return [];
    }

    const posterSize = toClipPosterSize(clip.aspectRatio);

    return [
        { property: "og:image", content: posterUrl },
        { property: "og:image:type", content: "image/jpeg" },
        { property: "og:image:width", content: String(posterSize.width) },
        { property: "og:image:height", content: String(posterSize.height) },
        { property: "og:image:alt", content: clip.title },
    ];
}

/**
 * The tab title and the link preview of a shared clip. Its link is a secret handed to a few
 * people, so search engines are told to leave it out.
 */
export function buildSharedClipHead(clip: SharedClip): Array<HeadMeta> {
    const videoSize = ASPECT_RATIO_SIZES[clip.aspectRatio];

    return [
        { title: `${clip.title} · Nelcota` },
        { name: "description", content: SHARED_CLIP_DESCRIPTION },
        { name: "robots", content: "noindex" },
        { property: "og:type", content: "video.other" },
        { property: "og:url", content: clip.pageUrl },
        { property: "og:title", content: clip.title },
        { property: "og:description", content: SHARED_CLIP_DESCRIPTION },
        { property: "og:video", content: clip.videoUrl },
        { property: "og:video:type", content: "video/mp4" },
        { property: "og:video:width", content: String(videoSize.width) },
        { property: "og:video:height", content: String(videoSize.height) },
        { property: "video:duration", content: String(Math.round(clip.durationSeconds)) },
        ...buildPosterMeta(clip),
    ];
}
