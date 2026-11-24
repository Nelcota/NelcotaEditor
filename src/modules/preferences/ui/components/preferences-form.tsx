import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import type { ReactNode } from "react";
import {
    CLIP_LENGTH_HINTS,
    TRANSCRIPTION_LANGUAGES,
    TRANSCRIPTION_LANGUAGE_LABELS,
} from "#/modules/preferences/model/preferences";
import type { Preferences, TranscriptionLanguage } from "#/modules/preferences/model/preferences";
import { savePreferences } from "#/modules/preferences/server/preferences-functions";
import { PREFERENCES_QUERY_KEY } from "#/modules/preferences/ui/hooks/preferences-queries";
import { SaveStatus } from "#/modules/preferences/ui/components/save-status";
import { ClipCountStepper } from "#/modules/preferences/ui/components/clip-count-stepper";
import { ClipLengthPicker } from "#/modules/preferences/ui/components/clip-length-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/shared/ui/select";
import { SettingsRow } from "#/shared/ui/settings-row";

// Radix select values cannot be "", so "detect automatically" is "auto" on screen only.
const AUTO_OPTION = "auto";

function toOptionValue(language: TranscriptionLanguage): string {
    if (language === "") {
        return AUTO_OPTION;
    }

    return language;
}

function fromOptionValue(value: string): TranscriptionLanguage {
    const language = TRANSCRIPTION_LANGUAGES.find((candidate) => candidate === value);

    return language ?? "";
}

interface LanguageSelectProps {
    labelId: string;
    value: TranscriptionLanguage;
    onValueChange: (language: TranscriptionLanguage) => void;
}

function LanguageSelect({ labelId, value, onValueChange }: LanguageSelectProps): ReactNode {
    return (
        <Select
            value={toOptionValue(value)}
            onValueChange={(next) => onValueChange(fromOptionValue(next))}
        >
            <SelectTrigger
                aria-labelledby={labelId}
                className="h-9 rounded-xl border-transparent bg-card font-semibold hover:border-input/40 hover:bg-accent"
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
                {TRANSCRIPTION_LANGUAGES.map((language) => (
                    <SelectItem key={toOptionValue(language)} value={toOptionValue(language)}>
                        {TRANSCRIPTION_LANGUAGE_LABELS[language]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

/**
 * The Seus cortes group's rows. Each change saves on its own; the last line says whether it
 * reached the server.
 */
export function PreferencesForm({ initial }: { initial: Preferences }): ReactNode {
    const queryClient = useQueryClient();
    const languageLabelId = useId();
    const [preferences, setPreferences] = useState<Preferences>(initial);
    const save = useMutation({
        mutationFn: (next: Preferences) => savePreferences({ data: next }),
        onSuccess: (saved) => {
            queryClient.setQueryData(PREFERENCES_QUERY_KEY, saved);
        },
    });

    const change = (next: Preferences): void => {
        setPreferences(next);
        save.mutate(next);
    };

    return (
        <>
            <SettingsRow
                label="Cortes por vídeo"
                description="Já vem escolhido em cada vídeo novo; dá para mudar ao enviar."
            >
                <div className="w-48">
                    <ClipCountStepper
                        id="default-clip-count"
                        label="Cortes por vídeo"
                        labelClassName="sr-only"
                        value={preferences.defaultClipCount}
                        onValueChange={(defaultClipCount) =>
                            change({ ...preferences, defaultClipCount })
                        }
                    />
                </div>
            </SettingsRow>
            <SettingsRow
                label="Duração dos cortes"
                description={
                    <span aria-live="polite">
                        {CLIP_LENGTH_HINTS[preferences.defaultClipLength]}
                    </span>
                }
            >
                <ClipLengthPicker
                    isInline
                    value={preferences.defaultClipLength}
                    onValueChange={(defaultClipLength) =>
                        change({ ...preferences, defaultClipLength })
                    }
                />
            </SettingsRow>
            <SettingsRow
                label="Idioma da transcrição"
                labelId={languageLabelId}
                description="Escolher o idioma deixa a legenda mais precisa."
            >
                <LanguageSelect
                    labelId={languageLabelId}
                    value={preferences.transcriptionLanguage}
                    onValueChange={(transcriptionLanguage) =>
                        change({ ...preferences, transcriptionLanguage })
                    }
                />
            </SettingsRow>
            <div className="px-4 py-1 sm:px-5">
                <SaveStatus status={save.status} onRetry={() => save.mutate(preferences)} />
            </div>
        </>
    );
}
