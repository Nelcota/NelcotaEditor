import type { ReactNode } from "react";
import { ProfileCard } from "#/modules/auth/ui/profile-card";
import { useFirstName } from "#/modules/auth/ui/use-first-name";
import { PreferencesSection } from "#/modules/preferences/ui/preferences-section";
import { AccountSectionHeading } from "#/modules/shell/ui/account-section-heading";
import { DeleteAccountDisclosure } from "#/modules/shell/ui/delete-account-disclosure";
import { CREW_NAMES } from "#/modules/videos/crew-lines";
import { StageCrewMascot } from "#/modules/videos/ui/stage-crew-mascot";
import { CrewUsagePanel } from "#/modules/videos/ui/crew-usage-panel";
import { PageHeader } from "#/shared/ui/page-header";

const SECTION_MASCOT_CLASS = "size-11 shrink-0";

/**
 * A greeting, then each section hosted by the crew member behind that part of the work, with one
 * short line beside the facts: Brilho picks the moments, Sorte reports, Guarda keeps the way out.
 */
export function AccountScreen(): ReactNode {
    const firstName = useFirstName();

    return (
        <div className="grid w-full max-w-3xl grid-cols-[minmax(0,1fr)] gap-8">
            <PageHeader
                title="Conta"
                description={`Oi, ${firstName}! A turma trabalha do jeito que você deixar aqui.`}
            />
            <ProfileCard />
            <section aria-labelledby="preferences-title" className="grid gap-3">
                <AccountSectionHeading
                    id="preferences-title"
                    title="Seus cortes"
                    description={`${CREW_NAMES.selecting} escolhe os momentos seguindo isto em cada vídeo novo.`}
                    art={<StageCrewMascot status="selecting" className={SECTION_MASCOT_CLASS} />}
                />
                <PreferencesSection />
            </section>
            <section aria-labelledby="usage-title" className="grid gap-3">
                <AccountSectionHeading
                    id="usage-title"
                    title="O que a turma já fez"
                    description="Cada número é de quem fez aquela parte."
                    art={<StageCrewMascot status="done" className={SECTION_MASCOT_CLASS} />}
                />
                <CrewUsagePanel />
            </section>
            <DeleteAccountDisclosure
                summary="Excluir conta"
                art={<StageCrewMascot status="failed" className="size-6" />}
            />
        </div>
    );
}
