import type { VideoSummary } from "#/modules/videos/model/video-views";

const FALLBACK_FAILURE_MESSAGE =
    "Algo deu errado no processamento. Tente de novo; se repetir, envie o vídeo outra vez.";

/**
 * What went wrong, in full: a failed retry first, then the stored error, then a generic line.
 * A blank message counts as none, so the row never shows an empty red line.
 */
export function describeVideoFailure(
    video: Pick<VideoSummary, "errorMessage">,
    retryError: string | null,
): string {
    const candidates = [retryError, video.errorMessage];
    const message = candidates.find(
        (candidate) => candidate !== null && candidate.trim().length > 0,
    );

    if (message === undefined || message === null) {
        return FALLBACK_FAILURE_MESSAGE;
    }

    return message;
}
