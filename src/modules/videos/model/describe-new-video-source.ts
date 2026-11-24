import { resolveUploadTitle } from "#/modules/videos/model/resolve-upload-title";
import type { YoutubePreview } from "#/modules/videos/model/youtube-preview";
import { toLinkVideoId } from "#/modules/videos/model/video-source";
import type { VideoSource } from "#/modules/videos/model/video-source";
import { formatBytes } from "#/shared/ui/format";

export interface PreviewText {
    title: string;
    detail: string;
}

function describeLink(preview: YoutubePreview | undefined): PreviewText {
    if (preview === undefined || preview.kind === "unavailable") {
        return { title: "Vídeo do YouTube", detail: "YouTube" };
    }

    const channel = preview.channel;

    if (channel === null) {
        return { title: preview.title, detail: "YouTube" };
    }

    return { title: preview.title, detail: `YouTube · ${channel}` };
}

/** The title the video will get: what the server stores for a file, else YouTube's. */
export function describeNewVideoSource(
    source: VideoSource,
    title: string,
    preview: YoutubePreview | undefined,
): PreviewText {
    if (source.kind === "file") {
        const file = source.file;

        return {
            title: resolveUploadTitle(file.name, title),
            detail: `Arquivo · ${formatBytes(file.size)}`,
        };
    }

    if (toLinkVideoId(source) === null) {
        return { title: "Seu vídeo", detail: "Cole um link ou escolha um arquivo" };
    }

    return describeLink(preview);
}

export function describeClipCount(clipCount: number): string {
    if (clipCount === 1) {
        return "1 corte";
    }

    return `${clipCount} cortes`;
}
