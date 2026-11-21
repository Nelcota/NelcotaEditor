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
import { ClipCountStepper } from "#/modules/preferences/ui/clip-count-stepper";
import { SegmentedControl } from "#/shared/ui/segmented-control";

// Radix radio values cannot be "", so "detect automatically" is "auto" on screen only.
const AUTO_OPTION = "auto";

const LANGUAGE_OPTIONS = TRANSCRIPTION_LANGUAGES.map((language) => ({
    value: toOptionValue(language),
    label: TRANSCRIPTION_LANGUAGE_LABELS[language],
}));

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
    // Four fixed choices: all visible at once instead of a list that opens over the page.
    return (
        <div className="grid gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold">
                <TranslationIcon aria-hidden="true" className="size-[18px] text-muted-foreground" />
                Idioma da transcrição
            </span>
            <SegmentedControl
                label="Idioma da transcrição"
                value={toOptionValue(props.value)}
                options={LANGUAGE_OPTIONS}
                onValueChange={(value) => props.onValueChange(fromOptionValue(value))}
                // "Detectar automaticamente" gets the whole first row; the three languages share
                // the second, so no pill breaks its label in two.
                className="grid-flow-row grid-cols-3 [&>button:first-child]:col-span-3"
            />
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
                    <ClipCountStepper
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
