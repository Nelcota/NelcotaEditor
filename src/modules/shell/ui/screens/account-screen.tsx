import type { ReactNode } from "react";
import { useFirstName } from "#/modules/shell/ui/hooks/use-first-name";
import { CREW_NAMES } from "#/modules/videos/model/crew-lines";
import { PageHeader } from "#/shared/ui/page-header";
import { SettingsGroup } from "#/shared/ui/settings-group";

/**
 * Conta as one column of grouped rows (direction C): Perfil, Seus cortes and Uso, each name on
 * the leading side and its control trailing, then the way out in its own red box.
 */
interface AccountScreenProps {
    /** Each section belongs to the module that owns its data; the route hands them in. */
    profileRows: ReactNode;
    preferencesSection: ReactNode;
    usageRows: ReactNode;
    deleteAccountRow: ReactNode;
}

export function AccountScreen({
    profileRows,
    preferencesSection,
    usageRows,
    deleteAccountRow,
}: AccountScreenProps): ReactNode {
    const firstName = useFirstName();

    return (
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)] gap-7">
            <PageHeader
                title="Conta"
                description={`Oi, ${firstName}! A turma trabalha do jeito que você deixar aqui.`}
            />
            <SettingsGroup title="Perfil">{profileRows}</SettingsGroup>
            <SettingsGroup
                title="Seus cortes"
                description={`${CREW_NAMES.selecting} segue isto em cada vídeo novo.`}
            >
                {preferencesSection}
            </SettingsGroup>
            <SettingsGroup title="Uso">{usageRows}</SettingsGroup>
            {deleteAccountRow}
        </div>
    );
}
