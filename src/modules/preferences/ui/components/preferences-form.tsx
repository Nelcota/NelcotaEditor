import { useId } from "react";
import type { ReactNode } from "react";
import {
    CLIP_LENGTH_HINTS,
    CLIP_LENGTH_LABEL,
    CLIP_LENGTH_OPTIONS,
    TRANSCRIPTION_LANGUAGES,
    TRANSCRIPTION_LANGUAGE_LABELS,
} from "#/modules/preferences/model/preferences";
import type { Preferences, TranscriptionLanguage } from "#/modules/preferences/model/preferences";
import { useSavePreferences } from "#/modules/preferences/ui/hooks/use-save-preferences";
import { SaveStatus } from "#/modules/preferences/ui/components/save-status";
import ScissorsIcon from "~icons/lucide/scissors";
import { CLIP_COUNT_STEPPER, QUICK_CLIP_COUNTS } from "#/modules/preferences/model/preferences";
import { QuickCountPicker } from "#/shared/ui/quick-count-picker";
import { SegmentedControl } from "#/shared/ui/segmented-control";
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
                className="h-10 rounded-xl border-transparent bg-card font-semibold hover:border-input/40 hover:bg-accent"
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
 * The Seus cortes group's rows, showing the cached preferences. Each change saves on its own;
 * the last line says whether it reached the server.
 */
export function PreferencesForm({ preferences }: { preferences: Preferences }): ReactNode {
    const languageLabelId = useId();
    const save = useSavePreferences();
    const lastChange = save.variables;

    const retry = (): void => {
        if (lastChange === undefined) {
            return;
        }

        save.mutate(lastChange);
    };

    return (
        <>
            <SettingsRow
                label="Cortes por vídeo"
                description="Já vem escolhido em cada vídeo novo; dá para mudar ao enviar."
            >
                <QuickCountPicker
                    id="default-clip-count"
                    label="Cortes por vídeo"
                    icon={
                        <ScissorsIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                    }
                    quickCounts={QUICK_CLIP_COUNTS}
                    stepper={CLIP_COUNT_STEPPER}
                    value={preferences.defaultClipCount}
                    onValueChange={(defaultClipCount) => save.mutate({ defaultClipCount })}
                />
            </SettingsRow>
            <SettingsRow
                label={CLIP_LENGTH_LABEL}
                description={
                    <span aria-live="polite">
                        {CLIP_LENGTH_HINTS[preferences.defaultClipLength]}
                    </span>
                }
            >
                <SegmentedControl
                    label={CLIP_LENGTH_LABEL}
                    options={CLIP_LENGTH_OPTIONS}
                    className="flex-nowrap [&>button]:whitespace-nowrap"
                    value={preferences.defaultClipLength}
                    onValueChange={(defaultClipLength) => save.mutate({ defaultClipLength })}
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
                        save.mutate({ transcriptionLanguage })
                    }
                />
            </SettingsRow>
            <div className="px-5 py-2 sm:px-6">
                <SaveStatus status={save.status} onRetry={retry} />
            </div>
        </>
    );
}
