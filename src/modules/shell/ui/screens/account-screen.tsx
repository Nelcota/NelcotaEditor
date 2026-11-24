import type { ReactNode } from "react";
import { DeleteAccountRow } from "#/modules/auth/ui/components/delete-account-row";
import { ProfileRows } from "#/modules/auth/ui/components/profile-rows";
import { useFirstName } from "#/modules/auth/ui/hooks/use-first-name";
import { PreferencesSection } from "#/modules/preferences/ui/components/preferences-section";
import { CREW_NAMES } from "#/modules/videos/model/crew-lines";
import { UsageRows } from "#/modules/videos/ui/components/usage-rows";
import { PageHeader } from "#/shared/ui/page-header";
import { SettingsGroup } from "#/shared/ui/settings-group";

/**
 * Conta as one column of grouped rows (direction C): Perfil, Seus cortes and Uso, each name on
 * the leading side and its control trailing, then the way out in its own red box.
 */
export function AccountScreen(): ReactNode {
    const firstName = useFirstName();

    return (
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)] gap-7">
            <PageHeader
                title="Conta"
                description={`Oi, ${firstName}! A turma trabalha do jeito que você deixar aqui.`}
            />
            <SettingsGroup title="Perfil">
                <ProfileRows />
            </SettingsGroup>
            <SettingsGroup
                title="Seus cortes"
                description={`${CREW_NAMES.selecting} segue isto em cada vídeo novo.`}
            >
                <PreferencesSection />
            </SettingsGroup>
            <SettingsGroup title="Uso">
                <UsageRows />
            </SettingsGroup>
            <DeleteAccountRow />
        </div>
    );
}
