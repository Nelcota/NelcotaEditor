import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId } from "react";
import type { ReactNode } from "react";
import { APP_SWITCH_COPY } from "#/modules/admin/model/admin-app-switches";
import type { AdminAppSwitch } from "#/modules/admin/model/admin-app-switches";
import { invalidateAdminQueries } from "#/modules/admin/model/admin-queries";
import { setAdminAppSwitch } from "#/modules/admin/server/admin-app-switch-functions";
import type { AdminConfirmation } from "#/modules/admin/ui/components/admin-confirm-dialog";
import { APP_SWITCHES_QUERY_KEY } from "#/modules/app-switches/model/app-switch-queries";
import { FormAlert } from "#/shared/ui/form-alert";
import { formatDateTime } from "#/shared/ui/format";
import { SettingsRow } from "#/shared/ui/settings-row";
import { Switch } from "#/shared/ui/switch";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const FALLBACK_ERROR_MESSAGE = "Não foi possível mudar. Confira sua conexão e tente de novo.";

interface AdminAppSwitchRowProps {
    appSwitch: AdminAppSwitch;
    /** Opens the confirmation for a change that locks people out. */
    onConfirm: (confirmation: AdminConfirmation) => void;
}

function describeLastChange(appSwitch: AdminAppSwitch): string {
    const changedAt = appSwitch.changedAt;

    if (changedAt === null) {
        return "Nunca alterado";
    }

    return `${appSwitch.changedByName ?? "Admin removido"} · ${formatDateTime(changedAt)}`;
}

/** One switch: its name, what turning it off does, who changed it last, and the control. */
export function AdminAppSwitchRow({ appSwitch, onConfirm }: AdminAppSwitchRowProps): ReactNode {
    const labelId = useId();
    const queryClient = useQueryClient();
    const { key, isEnabled } = appSwitch;
    const copy = APP_SWITCH_COPY[key];
    const confirmation = copy.confirmation;
    const saveSwitch = async (nextIsEnabled: boolean): Promise<void> => {
        await setAdminAppSwitch({ data: { key, isEnabled: nextIsEnabled } });
        await queryClient.invalidateQueries({ queryKey: APP_SWITCHES_QUERY_KEY });
    };
    const change = useMutation({
        mutationFn: async (nextIsEnabled: boolean) => {
            await saveSwitch(nextIsEnabled);
            await invalidateAdminQueries(queryClient);
        },
    });

    const handleCheckedChange = (nextIsEnabled: boolean): void => {
        if (confirmation !== null && nextIsEnabled === copy.confirmWhenEnabled) {
            onConfirm({
                ...confirmation,
                isDestructive: true,
                run: () => saveSwitch(nextIsEnabled),
            });
            return;
        }

        change.mutate(nextIsEnabled);
    };

    return (
        <SettingsRow
            labelId={labelId}
            label={copy.label}
            description={
                <span className="grid gap-2">
                    {copy.description}
                    {change.isError === true && (
                        <FormAlert message={toErrorMessage(change.error, FALLBACK_ERROR_MESSAGE)} />
                    )}
                </span>
            }
        >
            <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground tabular-nums">
                    {describeLastChange(appSwitch)}
                </span>
                <Switch
                    aria-labelledby={labelId}
                    checked={isEnabled}
                    disabled={change.isPending}
                    aria-busy={change.isPending}
                    onCheckedChange={handleCheckedChange}
                />
            </div>
        </SettingsRow>
    );
}
