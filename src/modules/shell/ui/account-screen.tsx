import DangerTriangleIcon from "~icons/solar/danger-triangle-linear";
import SettingsIcon from "~icons/solar/settings-linear";
import UsersGroupRoundedIcon from "~icons/solar/users-group-rounded-linear";
import type { ReactNode } from "react";
import { DeleteAccountSection } from "#/modules/auth/ui/delete-account-section";
import { ProfileCard } from "#/modules/auth/ui/profile-card";
import { PreferencesSection } from "#/modules/preferences/ui/preferences-section";
import { CrewUsagePanel } from "#/modules/videos/ui/crew-usage-panel";
import type { IconComponent } from "#/shared/ui/icon-component";
import { PageHeader } from "#/shared/ui/page-header";

interface AccountSectionProps {
    id: string;
    icon: IconComponent;
    title: string;
    description: string;
    children: ReactNode;
}

function AccountSection(props: AccountSectionProps): ReactNode {
    const Icon = props.icon;

    return (
        <section aria-labelledby={props.id} className="grid gap-4">
            <div>
                <h2
                    id={props.id}
                    className="flex items-center gap-2 text-lg leading-tight font-extrabold"
                >
                    <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
                    {props.title}
                </h2>
                <p className="text-sm text-muted-foreground">{props.description}</p>
            </div>
            {props.children}
        </section>
    );
}

/** Profile on top, then what the person can change, then what the crew has done, then danger. */
export function AccountScreen(): ReactNode {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <PageHeader
                title="Conta"
                description="Seu perfil, suas preferências e quanto você já usou."
            />
            <ProfileCard />
            <AccountSection
                id="preferences-title"
                icon={SettingsIcon}
                title="Preferências"
                description="O que já vem escolhido quando você adiciona um vídeo."
            >
                <PreferencesSection />
            </AccountSection>
            <AccountSection
                id="usage-title"
                icon={UsersGroupRoundedIcon}
                title="Uso"
                description="O que a equipe já fez por você desde que a conta foi criada."
            >
                <CrewUsagePanel />
            </AccountSection>
            <AccountSection
                id="danger-title"
                icon={DangerTriangleIcon}
                title="Zona de perigo"
                description="Ações que não têm volta."
            >
                <DeleteAccountSection />
            </AccountSection>
        </div>
    );
}
