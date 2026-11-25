import type { ReactNode } from "react";
import { MascotAnimationSetting } from "#/modules/shell/ui/components/mascot-animation-setting";
import { PageHeader } from "#/shared/ui/page-header";
import { SettingsGroup } from "#/shared/ui/settings-group";

/**
 * Conta as one column of grouped rows, each name on
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
    return (
        <div className="mx-auto grid w-full max-w-4xl grid-cols-[minmax(0,1fr)] gap-8">
            <PageHeader title="Conta" description="Perfil, preferências dos cortes e uso." />
            <SettingsGroup title="Perfil">{profileRows}</SettingsGroup>
            <SettingsGroup title="Aparência">
                <MascotAnimationSetting />
            </SettingsGroup>
            <SettingsGroup title="Seus cortes" description="Valem para cada vídeo novo.">
                {preferencesSection}
            </SettingsGroup>
            <SettingsGroup title="Uso">{usageRows}</SettingsGroup>
            {deleteAccountRow}
        </div>
    );
}
