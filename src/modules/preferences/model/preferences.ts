import { z } from "zod";
import { CLIP_LENGTHS, DEFAULT_CLIP_LENGTH } from "#/modules/video-records/model/clip-length";
import type { ClipLength } from "#/modules/video-records/model/clip-length";
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
    short: "Curtos",
    minute: "1 minuto",
    free: "Livre",
};

export const CLIP_LENGTH_HINTS: Record<ClipLength, string> = {
    short: "Cerca de 30 segundos cada",
    minute: "Cerca de 1 minuto cada",
    free: "Do tamanho que cada trecho pedir",
};

export const preferencesSchema = z.object({
    defaultClipCount: z.number().int().min(MIN_CLIP_COUNT).max(MAX_CLIP_COUNT),
    defaultClipLength: z.enum(CLIP_LENGTHS),
    transcriptionLanguage: z.enum(TRANSCRIPTION_LANGUAGES),
});

export type Preferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
    defaultClipCount: DEFAULT_CLIP_COUNT,
    defaultClipLength: DEFAULT_CLIP_LENGTH,
    transcriptionLanguage: "",
};
