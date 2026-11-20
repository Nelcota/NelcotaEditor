import { z } from "zod";
import { DEFAULT_CLIP_COUNT, MAX_CLIP_COUNT, MIN_CLIP_COUNT } from "#/modules/videos/video-status";

/** "" means "detect automatically"; the rest are ISO 639-1 codes Whisper understands. */
export const TRANSCRIPTION_LANGUAGES = ["", "pt", "en", "es"] as const;

export type TranscriptionLanguage = (typeof TRANSCRIPTION_LANGUAGES)[number];

export const TRANSCRIPTION_LANGUAGE_LABELS: Record<TranscriptionLanguage, string> = {
    "": "Detectar automaticamente",
    pt: "Português",
    en: "Inglês",
    es: "Espanhol",
};

export const preferencesSchema = z.object({
    defaultClipCount: z.number().int().min(MIN_CLIP_COUNT).max(MAX_CLIP_COUNT),
    transcriptionLanguage: z.enum(TRANSCRIPTION_LANGUAGES),
});

export type Preferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
    defaultClipCount: DEFAULT_CLIP_COUNT,
    transcriptionLanguage: "",
};

/** What the transcriber receives: null lets Whisper detect the language. */
export function toWhisperLanguage(language: TranscriptionLanguage): string | null {
    if (language.length === 0) {
        return null;
    }

    return language;
}
