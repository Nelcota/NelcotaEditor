import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import type { Preferences, PreferencesChange } from "#/modules/preferences/model/preferences";
import { PREFERENCES_QUERY_KEY } from "#/modules/preferences/model/preferences-queries";
import { revertPreferencesChange } from "#/modules/preferences/model/revert-preferences-change";
import { savePreferences } from "#/modules/preferences/server/preferences-functions";

const SAVE_PREFERENCES_KEY = ["save-preferences"];

// Saves in one scope run one after another, so an older save never lands after a newer one.
const SAVE_PREFERENCES_SCOPE = { id: "save-preferences" };

/** The cached preferences from before a save changed them, to put back if it fails. */
type PreviousPreferences = Preferences | undefined;

/**
 * Saves one change to the preferences. The cached preferences change at once, so every screen
 * that reads them shows the new value while the save is on its way.
 */
export function useSavePreferences(): UseMutationResult<
    void,
    Error,
    PreferencesChange,
    PreviousPreferences
> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: SAVE_PREFERENCES_KEY,
        scope: SAVE_PREFERENCES_SCOPE,
        mutationFn: async (change: PreferencesChange): Promise<void> =>
            savePreferences({ data: change }),
        onMutate: async (change: PreferencesChange): Promise<PreviousPreferences> => {
            // A refetch already on its way would land after this change and undo it on screen.
            await queryClient.cancelQueries({ queryKey: PREFERENCES_QUERY_KEY });
            const previous = queryClient.getQueryData<Preferences>(PREFERENCES_QUERY_KEY);
            queryClient.setQueryData<Preferences>(PREFERENCES_QUERY_KEY, (current) => {
                if (current === undefined) {
                    return current;
                }

                return { ...current, ...change };
            });

            return previous;
        },
        onError: (_error, change, previous): void => {
            if (previous === undefined) {
                return;
            }

            queryClient.setQueryData<Preferences>(PREFERENCES_QUERY_KEY, (current) => {
                if (current === undefined) {
                    return current;
                }

                return revertPreferencesChange(current, change, previous);
            });
        },
        onSettled: async (): Promise<void> => {
            // Only the last save in line reloads; the saves still waiting hold newer values.
            if (queryClient.isMutating({ mutationKey: SAVE_PREFERENCES_KEY }) > 1) {
                return;
            }

            await queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY });
        },
    });
}
