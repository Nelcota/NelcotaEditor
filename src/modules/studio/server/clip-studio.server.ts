import type { Clip } from "#/modules/clips/clips.schema";
import type { CaptionWord, StudioDraft } from "#/modules/clips/model/clip-studio";
import { TIME_TOLERANCE_SECONDS, studioDraftSchema } from "#/modules/clips/model/clip-studio";
import { findTranscriptWords as findSavedTranscriptWords } from "#/modules/transcription/server/find-transcript-words.server";
import { isVideoFinished } from "#/modules/video-records/model/video-status";
import type { Video } from "#/modules/video-records/video-records.schema";
import { UserFacingError } from "#/shared/server/user-facing-error";
import { logger } from "#/shared/server/logger.server";

/** The Studio shows a video without a transcript as one without words. */
export async function findStudioWords(videoId: string): Promise<Array<CaptionWord>> {
    const words = await findSavedTranscriptWords(videoId);

    if (words === null) {
        return [];
    }

    return words;
}

/**
 * The saved draft, read through the schema: drafts kept before a setting existed get its default,
 * and one that no longer fits the rules is dropped rather than shown broken.
 */
export function readStoredDraft(clip: Clip): StudioDraft | null {
    const stored = clip.studioDraft;

    if (stored === null) {
        return null;
    }

    const result = studioDraftSchema.safeParse(stored);

    if (result.success === false) {
        logger.warn({ clipId: clip.id }, "Ignoring an invalid Studio draft");
        return null;
    }

    return result.data;
}

/** The worker owns the video's files while it runs, so the Studio waits for it. */
export function assertVideoEditable(video: Video): void {
    if (isVideoFinished(video.status) === false) {
        throw new UserFacingError("Aguarde o processamento terminar para editar o corte.");
    }
}

/** The client already checks this; the server checks again with the real duration. */
export function assertDraftFitsVideo(draft: StudioDraft, video: Video): void {
    const durationSeconds = video.durationSeconds;

    // A clip only exists after the source was probed, so a missing duration is inconsistent data:
    // refuse rather than skip the check.
    if (durationSeconds === null) {
        throw new UserFacingError("Não foi possível ler a duração do vídeo.");
    }

    if (draft.endSeconds > durationSeconds + TIME_TOLERANCE_SECONDS) {
        throw new UserFacingError("O fim do corte passa da duração do vídeo.");
    }
}
