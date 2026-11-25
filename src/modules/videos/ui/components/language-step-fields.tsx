import type { ReactNode } from "react";
import {
    TRANSCRIPTION_LANGUAGE_LABELS,
    TRANSCRIPTION_LANGUAGES,
} from "#/modules/preferences/model/preferences";
import type { TranscriptionLanguage } from "#/modules/preferences/model/preferences";

/** One line under each option, so the choice is clear without reading a manual. */
const LANGUAGE_HINTS: Record<TranscriptionLanguage, string> = {
    "": "Descobrimos o idioma sozinhos. Funciona na maioria dos vídeos.",
    pt: "Fala em português do Brasil ou de Portugal.",
    en: "Fala em inglês.",
    es: "Fala em espanhol.",
};

interface LanguageStepProps {
    language: TranscriptionLanguage;
    onLanguageChange: (language: TranscriptionLanguage) => void;
}

/** The language spoken in this video; it starts from the account's preference. */
export function LanguageStepFields({ language, onLanguageChange }: LanguageStepProps): ReactNode {
    return (
        <fieldset className="grid gap-4">
            {/* The step's title asks the same question out loud; the legend names the group. */}
            <legend className="sr-only">Em que idioma as pessoas falam?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
                {TRANSCRIPTION_LANGUAGES.map((option) => (
                    <label
                        key={option}
                        className="grid cursor-pointer gap-1 rounded-xl border p-4 transition-[color,background-color,border-color,box-shadow,scale] hover:bg-secondary/60 has-checked:border-foreground has-checked:bg-secondary has-checked:ring-2 has-checked:ring-foreground has-focus-visible:ring-4 has-focus-visible:ring-ring motion-safe:active:scale-[0.99]"
                    >
                        <input
                            type="radio"
                            name="new-video-language"
                            value={option}
                            checked={language === option}
                            onChange={() => onLanguageChange(option)}
                            className="sr-only"
                        />
                        <span className="font-semibold">
                            {TRANSCRIPTION_LANGUAGE_LABELS[option]}
                        </span>
                        <span className="text-meta text-muted-foreground">
                            {LANGUAGE_HINTS[option]}
                        </span>
                    </label>
                ))}
            </div>
            <p className="max-w-prose text-sm text-muted-foreground">
                O padrão vem das suas preferências, na página Conta.
            </p>
        </fieldset>
    );
}
