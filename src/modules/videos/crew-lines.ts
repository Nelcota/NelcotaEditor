import type { VideoStatus } from "#/modules/videos/video-status";
import type { VideoSummary } from "#/modules/videos/video-views";

/**
 * The cast. Each stage has a character with a name and a temperament (see DESIGN.md › Mascots).
 * Tone: friendly and discreet — one short line, always next to the facts, never instead of them.
 */
export const CREW_NAMES: Record<VideoStatus, string> = {
    queued: "Luna",
    downloading: "Faísca",
    transcribing: "Tinta",
    selecting: "Brilho",
    rendering: "Brasa",
    done: "Sorte",
    failed: "Guarda",
    cancelled: "Cogu",
};

/** The brand ghost hosts the empty and first-time screens. */
export const HOST_NAME = "Nel";

/** "done" and "failed" speak about the result instead, so they have no fixed line. */
const WORKING_LINES: Record<Exclude<VideoStatus, "done" | "failed">, string> = {
    queued: "Luna está guardando seu lugar na fila",
    downloading: "Faísca está trazendo o vídeo do YouTube",
    transcribing: "Tinta está escrevendo cada palavra",
    selecting: "Brilho está escolhendo os melhores momentos",
    rendering: "Brasa está montando os cortes",
    cancelled: "Cogu guardou o que já estava pronto",
};

function describeReadyClips(count: number): string {
    if (count === 1) {
        return "1 corte pronto";
    }

    return `${count} cortes prontos`;
}

/** One line about where a video is, in the voice of the character on that stage. */
export function toCrewLine(video: VideoSummary): string {
    const status = video.status;

    if (status === "done") {
        return describeReadyClips(video.readyClipCount);
    }

    if (status === "failed") {
        return video.errorMessage ?? "Guarda encontrou um problema";
    }

    return WORKING_LINES[status];
}
