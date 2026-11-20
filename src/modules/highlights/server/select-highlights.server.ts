import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { toOverallPercent } from "#/modules/processing/processing-stages";
import { clips } from "#/modules/clips/clips.schema";
import type { Clip } from "#/modules/clips/clips.schema";
import {
    buildTranscriptLines,
    formatTranscriptLines,
} from "#/modules/highlights/build-transcript-lines";
import { buildHighlightSystemPrompt } from "#/modules/highlights/highlight-prompt";
import { normalizeHighlights } from "#/modules/highlights/normalize-highlights";
import type { HighlightCandidate } from "#/modules/highlights/normalize-highlights";
import { requestJsonCompletion } from "#/modules/highlights/server/deepseek-client.server";
import type { TranscriptWord } from "#/modules/transcription/transcript-word";
import { updateVideoStage } from "#/modules/videos/server/video-progress.server";
import type { Video } from "#/modules/videos/videos.schema";
import { UserFacingError } from "#/shared/server/user-facing-error";

// Used when the model leaves the score out: the middle of the 1–100 scale ranks it neutrally.
const DEFAULT_SCORE = 50;

const highlightResponseSchema = z.object({
    clips: z.array(
        z.object({
            start: z.coerce.number(),
            end: z.coerce.number(),
            title: z.string().default(""),
            reason: z.string().default(""),
            score: z.coerce.number().default(DEFAULT_SCORE),
        }),
    ),
});

type HighlightResponse = z.infer<typeof highlightResponseSchema>;

async function findClips(videoId: string): Promise<Array<Clip>> {
    return db.select().from(clips).where(eq(clips.videoId, videoId)).orderBy(asc(clips.position));
}

export interface HighlightSelectionInput {
    video: Video;
    words: Array<TranscriptWord>;
    durationSeconds: number;
    signal: AbortSignal;
}

function toCandidates(response: HighlightResponse): Array<HighlightCandidate> {
    return response.clips
        .filter(
            (clip) => Number.isFinite(clip.start) === true && Number.isFinite(clip.end) === true,
        )
        .map((clip) => ({
            startSeconds: clip.start,
            endSeconds: clip.end,
            title: clip.title,
            reason: clip.reason,
            score: clip.score,
        }));
}

const NO_SPEECH_MESSAGE =
    "Não encontramos fala neste vídeo. Os cortes são feitos a partir da fala, então vídeos só com música ou sem áudio não funcionam. Tente outro vídeo.";
const SHORT_VIDEO_SECONDS = 60;
const SHORT_VIDEO_MESSAGE =
    "Este vídeo é curto demais para gerar cortes (menos de 1 minuto). Tente um vídeo mais longo.";
const NO_HIGHLIGHTS_MESSAGE =
    "A IA não encontrou trechos bons neste vídeo. Tente de novo ou peça menos cortes.";

/** A very short video is the usual reason nothing fits the clip length limits, so say so. */
function describeNoHighlights(durationSeconds: number): string {
    if (durationSeconds < SHORT_VIDEO_SECONDS) {
        return SHORT_VIDEO_MESSAGE;
    }

    return NO_HIGHLIGHTS_MESSAGE;
}

async function requestCandidates(
    input: HighlightSelectionInput,
): Promise<Array<HighlightCandidate>> {
    const video = input.video;
    const transcript = formatTranscriptLines(buildTranscriptLines(input.words));
    const answer = await requestJsonCompletion(
        {
            system: buildHighlightSystemPrompt(video.requestedClipCount),
            user: `Video title: ${video.title}\n\nTranscript:\n${transcript}`,
        },
        input.signal,
    );
    const result = highlightResponseSchema.safeParse(answer);

    if (result.success === false) {
        throw new UserFacingError("A DeepSeek devolveu uma resposta inválida. Tente novamente.");
    }

    return toCandidates(result.data);
}

function titleOrFallback(title: string, position: number): string {
    if (title.length === 0) {
        return `Corte ${position}`;
    }

    return title;
}

async function saveHighlights(
    videoId: string,
    highlights: Array<HighlightCandidate>,
): Promise<Array<Clip>> {
    const rows = highlights.map((highlight, index) => {
        const position = index + 1;

        return {
            ...highlight,
            title: titleOrFallback(highlight.title, position),
            videoId,
            position,
        };
    });

    return db.insert(clips).values(rows).returning();
}

/** Returns the clips of the video, asking DeepSeek to choose them only the first time. */
export async function ensureHighlights(input: HighlightSelectionInput): Promise<Array<Clip>> {
    const { video, words, durationSeconds } = input;
    const existingClips = await findClips(video.id);

    if (existingClips.length > 0) {
        return existingClips;
    }

    if (words.length === 0) {
        throw new UserFacingError(NO_SPEECH_MESSAGE);
    }

    await updateVideoStage(video.id, "selecting", toOverallPercent("selecting", 0));
    const candidates = await requestCandidates(input);
    const highlights = normalizeHighlights(candidates, {
        words,
        durationSeconds,
        maxCount: video.requestedClipCount,
    });

    if (highlights.length === 0) {
        throw new UserFacingError(describeNoHighlights(durationSeconds));
    }

    return saveHighlights(video.id, highlights);
}
