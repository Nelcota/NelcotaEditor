import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { clips } from "#/modules/clips/clips.schema";
import type { Clip } from "#/modules/clips/clips.schema";
import {
    buildTranscriptLines,
    formatTranscriptLines,
} from "#/modules/transcription/model/build-transcript-lines";
import { buildHighlightSystemPrompt } from "#/modules/highlights/model/highlight-prompt";
import { normalizeHighlights } from "#/modules/highlights/model/normalize-highlights";
import type { HighlightCandidate } from "#/modules/highlights/model/normalize-highlights";
import {
    BROKEN_ANSWER_MESSAGE,
    requestJsonCompletion,
} from "#/modules/highlights/server/deepseek-client.server";
import type { TranscriptWord } from "#/modules/transcription/model/transcript-word";
import type { Video } from "#/modules/video-records/video-records.schema";
import { UserFacingError } from "#/shared/server/user-facing-error";

// Used when the model leaves the score out: the middle of the 1–100 scale ranks it neutrally.
const DEFAULT_SCORE = 50;

// About 100k tokens of Portuguese, inside deepseek-chat's 128k context with room for the prompt
// and the answer. A 3-hour video (the longest accepted) is about 200k characters.
const MAX_TRANSCRIPT_CHARACTERS = 300_000;
const TRANSCRIPT_TOO_LONG_MESSAGE =
    "A fala deste vídeo é longa demais para a IA escolher os cortes de uma vez. Tente um vídeo mais curto.";

// The prompt asks for at most 10; anything far beyond that is a broken answer, not more clips.
const MAX_RETURNED_CLIPS = 50;

// A number, or a numeric string such as "12.5". null, "", booleans and arrays are rejected instead
// of being coerced to 0, which would silently become a clip at the very start of the video.
const numericFieldSchema = z.union([z.number(), z.string().trim().min(1)]).pipe(z.coerce.number());

const highlightClipSchema = z.object({
    start: numericFieldSchema,
    end: numericFieldSchema,
    title: z.string().catch(""),
    reason: z.string().catch(""),
    score: numericFieldSchema.optional().catch(undefined),
});

type HighlightClip = z.infer<typeof highlightClipSchema>;

const highlightResponseSchema = z.object({
    clips: z.array(z.unknown()).max(MAX_RETURNED_CLIPS),
});

/** One malformed item is dropped; the valid ones still become clips. */
function parseHighlightClips(items: Array<unknown>): Array<HighlightClip> {
    const parsedClips: Array<HighlightClip> = [];

    for (const item of items) {
        const result = highlightClipSchema.safeParse(item);

        if (result.success === true) {
            parsedClips.push(result.data);
        }
    }

    return parsedClips;
}

async function findClips(videoId: string): Promise<Array<Clip>> {
    return db.select().from(clips).where(eq(clips.videoId, videoId)).orderBy(asc(clips.position));
}

export interface HighlightSelectionInput {
    video: Video;
    words: Array<TranscriptWord>;
    durationSeconds: number;
    signal: AbortSignal;
    /** Records this step's own progress (0 to 100); the pipeline maps it onto the whole run. */
    saveProgress: (stagePercent: number) => Promise<void>;
}

function toCandidates(highlightClips: Array<HighlightClip>): Array<HighlightCandidate> {
    return highlightClips
        .filter(
            (clip) => Number.isFinite(clip.start) === true && Number.isFinite(clip.end) === true,
        )
        .map((clip) => ({
            startSeconds: clip.start,
            endSeconds: clip.end,
            title: clip.title,
            reason: clip.reason,
            score: clip.score ?? DEFAULT_SCORE,
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

    // Over the model's context the API answers with an error that retrying never fixes; say why.
    if (transcript.length > MAX_TRANSCRIPT_CHARACTERS) {
        throw new UserFacingError(TRANSCRIPT_TOO_LONG_MESSAGE);
    }
    const answer = await requestJsonCompletion(
        {
            system: buildHighlightSystemPrompt(video.requestedClipCount, video.clipLength),
            user: `Video title: ${video.title}\n\nTranscript:\n${transcript}`,
        },
        input.signal,
    );
    const result = highlightResponseSchema.safeParse(answer);

    if (result.success === false) {
        throw new UserFacingError(BROKEN_ANSWER_MESSAGE, { cause: result.error });
    }

    const returnedItems = result.data.clips;
    const candidates = toCandidates(parseHighlightClips(returnedItems));
    console.info(
        `Highlights of video ${video.id}: ${returnedItems.length} returned, ${candidates.length} valid.`,
    );
    return candidates;
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

    // A slot another run already filled keeps its clip (UNIQUE video_id, position), so a second
    // selection can never duplicate the video's clips; the stored set is what gets rendered.
    await db
        .insert(clips)
        .values(rows)
        .onConflictDoNothing({ target: [clips.videoId, clips.position] });
    return findClips(videoId);
}

/** Returns the clips of the video, asking DeepSeek to choose them only the first time. */
export async function ensureHighlights(input: HighlightSelectionInput): Promise<Array<Clip>> {
    const { video, words, durationSeconds, saveProgress } = input;
    const existingClips = await findClips(video.id);

    if (existingClips.length > 0) {
        return existingClips;
    }

    if (words.length === 0) {
        throw new UserFacingError(NO_SPEECH_MESSAGE);
    }

    await saveProgress(0);
    const candidates = await requestCandidates(input);
    const highlights = normalizeHighlights(candidates, {
        words,
        durationSeconds,
        maxCount: video.requestedClipCount,
        clipLength: video.clipLength,
    });
    console.info(
        `Highlights of video ${video.id}: ${highlights.length} of ${candidates.length} kept after fitting.`,
    );

    if (highlights.length === 0) {
        throw new UserFacingError(describeNoHighlights(durationSeconds));
    }

    return saveHighlights(video.id, highlights);
}
