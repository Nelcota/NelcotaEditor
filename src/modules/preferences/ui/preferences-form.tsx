import TranslationIcon from "~icons/solar/translation-linear";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import {
    TRANSCRIPTION_LANGUAGES,
    TRANSCRIPTION_LANGUAGE_LABELS,
} from "#/modules/preferences/preferences";
import type { Preferences, TranscriptionLanguage } from "#/modules/preferences/preferences";
import { savePreferences } from "#/modules/preferences/server/preferences-functions";
import { PREFERENCES_QUERY_KEY } from "#/modules/preferences/ui/preferences-queries";
import { SaveStatus } from "#/modules/preferences/ui/save-status";
import { ClipCountSelect } from "#/modules/videos/ui/clip-count-select";
import { Label } from "#/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/shared/ui/select";

// Radix Select cannot use "" as a value, so "detect automatically" is "auto" on screen only.
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

function PreferenceField(props: { description: string; children: ReactNode }): ReactNode {
    return (
        <div className="grid content-start gap-2">
            {props.children}
            <p className="text-sm text-muted-foreground">{props.description}</p>
        </div>
    );
}

function LanguageSelect(props: {
    value: TranscriptionLanguage;
    onValueChange: (language: TranscriptionLanguage) => void;
}): ReactNode {
    return (
        <div className="grid gap-2">
            <Label htmlFor="transcription-language">
                <TranslationIcon aria-hidden="true" className="size-[18px] text-muted-foreground" />
                Idioma da transcrição
            </Label>
            <Select
                value={toOptionValue(props.value)}
                onValueChange={(value) => props.onValueChange(fromOptionValue(value))}
            >
                <SelectTrigger id="transcription-language" className="h-11 w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {TRANSCRIPTION_LANGUAGES.map((language) => (
                        <SelectItem key={language} value={toOptionValue(language)}>
                            {TRANSCRIPTION_LANGUAGE_LABELS[language]}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

/** Each change saves on its own; the status line says whether it reached the server. */
export function PreferencesForm({ initial }: { initial: Preferences }): ReactNode {
    const queryClient = useQueryClient();
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
        <div className="@container grid gap-5 rounded-2xl border bg-popover p-5 sm:p-6">
            <div className="grid gap-6 @2xl:grid-cols-2">
                <PreferenceField description="Já vem escolhido quando você adiciona um vídeo; dá para mudar em cada um.">
                    <ClipCountSelect
                        id="default-clip-count"
                        label="Cortes por vídeo"
                        value={preferences.defaultClipCount}
                        onValueChange={(defaultClipCount) =>
                            change({ ...preferences, defaultClipCount })
                        }
                    />
                </PreferenceField>
                <PreferenceField description="Escolher o idioma deixa a legenda mais precisa nos próximos vídeos.">
                    <LanguageSelect
                        value={preferences.transcriptionLanguage}
                        onValueChange={(transcriptionLanguage) =>
                            change({ ...preferences, transcriptionLanguage })
                        }
                    />
                </PreferenceField>
            </div>
            <SaveStatus status={save.status} onRetry={() => save.mutate(preferences)} />
        </div>
    );
}
