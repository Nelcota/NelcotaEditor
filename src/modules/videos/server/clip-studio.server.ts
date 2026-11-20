import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { groupWordsIntoCues, wordsInsideRange } from "#/modules/clips/caption-cues";
import type { Clip } from "#/modules/clips/clips.schema";
import type { CaptionWord, StudioDraft } from "#/modules/clips/clip-studio.schema";
import { TIME_TOLERANCE_SECONDS, studioDraftSchema } from "#/modules/clips/clip-studio.schema";
import { transcripts } from "#/modules/transcription/transcription.schema";
import { isVideoFinished } from "#/modules/videos/video-status";
import type { Video } from "#/modules/videos/videos.schema";
import { UserFacingError } from "#/shared/server/user-facing-error";

export async function findTranscriptWords(videoId: string): Promise<Array<CaptionWord>> {
    const rows = await db
        .select({ words: transcripts.words })
        .from(transcripts)
        .where(eq(transcripts.videoId, videoId))
        .limit(1);
    const transcript = rows[0];

    if (transcript === undefined) {
        return [];
    }

    return transcript.words;
}

/** The clip as it is rendered now, in the same shape the Studio edits. */
export function toAppliedDraft(clip: Clip, words: Array<CaptionWord>): StudioDraft {
    const editedCues = clip.captionCues;
    let cues = groupWordsIntoCues(wordsInsideRange(words, clip));

    if (editedCues !== null) {
        cues = editedCues;
    }

    return {
        startSeconds: clip.startSeconds,
        endSeconds: clip.endSeconds,
        aspectRatio: clip.aspectRatio,
        captionStyle: clip.captionStyle,
        captionColor: clip.captionColor,
        captionSize: clip.captionSize,
        captionPosition: clip.captionPosition,
        captionFont: clip.captionFont,
        cues,
    };
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
        console.warn(`Ignoring an invalid Studio draft for clip ${clip.id}`);
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

    if (durationSeconds === null) {
        return;
    }

    if (draft.endSeconds > durationSeconds + TIME_TOLERANCE_SECONDS) {
        throw new UserFacingError("O fim do corte passa da duração do vídeo.");
    }
}
