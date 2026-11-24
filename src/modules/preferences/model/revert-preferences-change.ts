import type { Preferences, PreferencesChange } from "#/modules/preferences/model/preferences";

/**
 * Puts back the fields a failed save had changed, except those the user changed again since:
 * those belong to a newer save.
 */
export function revertPreferencesChange(
    current: Preferences,
    change: PreferencesChange,
    previous: Preferences,
): Preferences {
    const reverted = { ...current };

    if (
        change.defaultClipCount !== undefined &&
        current.defaultClipCount === change.defaultClipCount
    ) {
        reverted.defaultClipCount = previous.defaultClipCount;
    }

    if (
        change.defaultClipLength !== undefined &&
        current.defaultClipLength === change.defaultClipLength
    ) {
        reverted.defaultClipLength = previous.defaultClipLength;
    }

    if (
        change.transcriptionLanguage !== undefined &&
        current.transcriptionLanguage === change.transcriptionLanguage
    ) {
        reverted.transcriptionLanguage = previous.transcriptionLanguage;
    }

    return reverted;
}
