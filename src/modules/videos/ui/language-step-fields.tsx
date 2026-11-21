import type { ReactNode } from "react";
import {
    TRANSCRIPTION_LANGUAGE_LABELS,
    TRANSCRIPTION_LANGUAGES,
} from "#/modules/preferences/preferences";
import type { TranscriptionLanguage } from "#/modules/preferences/preferences";

/** One line under each option, so the choice is clear without reading a manual. */
const LANGUAGE_HINTS: Record<TranscriptionLanguage, string> = {
    "": "A Tinta descobre sozinha. Funciona na maioria dos vídeos.",
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
            <legend className="mb-3 text-sm font-semibold">Em que idioma as pessoas falam?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
                {TRANSCRIPTION_LANGUAGES.map((option) => (
                    <label
                        key={option}
                        className="grid cursor-pointer gap-1 rounded-xl border p-4 transition-[color,background-color,border-color,box-shadow,scale] hover:bg-secondary/60 has-checked:border-primary has-checked:bg-primary/10 has-checked:ring-2 has-checked:ring-primary has-focus-visible:ring-4 has-focus-visible:ring-ring/70 motion-safe:active:scale-[0.99]"
                    >
                        <input
                            type="radio"
                            name="new-video-language"
                            value={option}
                            checked={language === option}
                            onChange={() => onLanguageChange(option)}
                            className="sr-only"
                        />
                        <span className="font-bold">{TRANSCRIPTION_LANGUAGE_LABELS[option]}</span>
                        <span className="text-meta text-muted-foreground">
                            {LANGUAGE_HINTS[option]}
                        </span>
                    </label>
                ))}
            </div>
            <p className="max-w-prose text-sm text-muted-foreground">
                Escolher o idioma certo deixa a legenda mais precisa. O padrão vem das suas
                preferências, na página Conta.
            </p>
        </fieldset>
    );
}
