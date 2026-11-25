import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import {
    APP_SWITCH_COPY,
    APP_SWITCH_GROUPS,
    isAppSwitchAwayFromDefault,
} from "#/modules/admin/model/admin-app-switches";
import type { AdminAppSwitch } from "#/modules/admin/model/admin-app-switches";
import { adminAppSwitchesQueryOptions } from "#/modules/admin/model/admin-queries";
import { AdminAppSwitchRow } from "#/modules/admin/ui/components/admin-app-switch-row";
import { AdminConfirmDialog } from "#/modules/admin/ui/components/admin-confirm-dialog";
import type { AdminConfirmation } from "#/modules/admin/ui/components/admin-confirm-dialog";
import { AdminLoadError, AdminLoading } from "#/modules/admin/ui/components/admin-states";
import { Alert } from "#/shared/ui/alert";
import { SettingsGroup } from "#/shared/ui/settings-group";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const LOAD_ERROR_MESSAGE = "Confira sua conexão e tente de novo.";

/** Says which switches are away from normal, so a forgotten pause is seen on arrival. */
function AwayFromDefaultNotice({ switches }: { switches: Array<AdminAppSwitch> }): ReactNode {
    const changed = switches.filter((appSwitch) =>
        isAppSwitchAwayFromDefault(appSwitch.key, appSwitch.isEnabled),
    );

    if (changed.length === 0) {
        return null;
    }

    const labels = changed.map((appSwitch) => APP_SWITCH_COPY[appSwitch.key].label).join(", ");

    return (
        <Alert tone="info" title="Fora do normal">
            {labels}.
        </Alert>
    );
}

function AdminAppSwitchGroups({ switches }: { switches: Array<AdminAppSwitch> }): ReactNode {
    const [confirmation, setConfirmation] = useState<AdminConfirmation | null>(null);
    const switchesByKey = new Map(switches.map((appSwitch) => [appSwitch.key, appSwitch]));

    return (
        <div className="grid max-w-3xl gap-6">
            <AwayFromDefaultNotice switches={switches} />
            {APP_SWITCH_GROUPS.map((group) => (
                <SettingsGroup key={group.title} title={group.title}>
                    {group.keys.map((key) => {
                        const appSwitch = switchesByKey.get(key);

                        if (appSwitch === undefined) {
                            return null;
                        }

                        return (
                            <AdminAppSwitchRow
                                key={key}
                                appSwitch={appSwitch}
                                onConfirm={setConfirmation}
                            />
                        );
                    })}
                </SettingsGroup>
            ))}
            <AdminConfirmDialog confirmation={confirmation} onClose={() => setConfirmation(null)} />
        </div>
    );
}

export function AdminAppSwitchesScreen(): ReactNode {
    const { data: switches, error, isPending, refetch } = useQuery(adminAppSwitchesQueryOptions());

    if (isPending === true) {
        return <AdminLoading label="Carregando recursos" />;
    }

    if (switches === undefined) {
        return (
            <AdminLoadError
                title="Não foi possível carregar os recursos"
                message={toErrorMessage(error, LOAD_ERROR_MESSAGE)}
                onRetry={refetch}
            />
        );
    }

    return <AdminAppSwitchGroups switches={switches} />;
}
