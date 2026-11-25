import { z } from "zod";
import { CLIP_LENGTHS, DEFAULT_CLIP_LENGTH } from "#/modules/video-records/model/clip-length";
import type { ClipLength } from "#/modules/video-records/model/clip-length";
import { pluralize } from "#/shared/ui/pluralize";
import {
    DEFAULT_CLIP_COUNT,
    MAX_CLIP_COUNT,
    MIN_CLIP_COUNT,
} from "#/modules/video-records/model/video-status";

/** "" means "detect automatically"; the rest are ISO 639-1 codes Whisper understands. */
export const TRANSCRIPTION_LANGUAGES = ["", "pt", "en", "es"] as const;

export type TranscriptionLanguage = (typeof TRANSCRIPTION_LANGUAGES)[number];

export const TRANSCRIPTION_LANGUAGE_LABELS: Record<TranscriptionLanguage, string> = {
    "": "Detectar automaticamente",
    pt: "Português",
    en: "Inglês",
    es: "Espanhol",
};

export const CLIP_LENGTH_LABELS: Record<ClipLength, string> = {
    short: "30 segundos",
    minute: "1 minuto",
    free: "Livre",
};

export const CLIP_LENGTH_HINTS: Record<ClipLength, string> = {
    short: "Cerca de 30 segundos cada",
    minute: "Cerca de 1 minuto cada",
    free: "Do tamanho que cada trecho pedir",
};

/** The clip lengths as segmented-control options, in order. */
export const CLIP_LENGTH_OPTIONS = CLIP_LENGTHS.map((clipLength) => ({
    value: clipLength,
    label: CLIP_LENGTH_LABELS[clipLength],
}));

export const CLIP_LENGTH_LABEL = "Duração dos cortes";

export const preferencesSchema = z.object({
    defaultClipCount: z.number().int().min(MIN_CLIP_COUNT).max(MAX_CLIP_COUNT),
    defaultClipLength: z.enum(CLIP_LENGTHS),
    transcriptionLanguage: z.enum(TRANSCRIPTION_LANGUAGES),
});

export type Preferences = z.infer<typeof preferencesSchema>;

/**
 * One save carries only the fields the user changed, so it never writes back a stale copy of a
 * field another device changed in the meantime.
 */
export const preferencesChangeSchema = preferencesSchema
    .partial()
    .refine((change) => Object.keys(change).length > 0, {
        message: "Informe ao menos uma preferência.",
    });

export type PreferencesChange = z.infer<typeof preferencesChangeSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
    defaultClipCount: DEFAULT_CLIP_COUNT,
    defaultClipLength: DEFAULT_CLIP_LENGTH,
    transcriptionLanguage: "",
};

function describeClipCount(count: number): string {
    return `${count} ${pluralize(count, "corte", "cortes")}`;
}

/** What a CountStepper needs to pick a number of clips. */
/** The clip counts people pick most, shown as pills; anything else in range is under "Outro". */
export const QUICK_CLIP_COUNTS: ReadonlyArray<number> = [3, 5, 8, 10];

export const CLIP_COUNT_STEPPER = {
    min: MIN_CLIP_COUNT,
    max: MAX_CLIP_COUNT,
    formatValue: describeClipCount,
    decreaseLabel: "Menos um corte",
    increaseLabel: "Mais um corte",
};
