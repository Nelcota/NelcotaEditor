import type { VideoSummary } from "#/modules/videos/video-views";

const FALLBACK_FAILURE_MESSAGE =
    "Guarda encontrou um problema. Tente de novo; se repetir, envie o vídeo outra vez.";

/** What went wrong, in full: a failed retry first, then the stored error, then a generic line. */
export function describeVideoFailure(video: VideoSummary, retryError: string | null): string {
    return retryError ?? video.errorMessage ?? FALLBACK_FAILURE_MESSAGE;
}
