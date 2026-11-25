import TrashIcon from "~icons/lucide/trash";
import { useState } from "react";
import type { ReactNode } from "react";
import { DeleteAccountDialog } from "#/modules/auth/ui/components/delete-account-dialog";
import { Button } from "#/shared/ui/button";
import { SettingsRow } from "#/shared/ui/settings-row";

/** The way out for good, in its own red-edged box, apart from the everyday settings. */
export function DeleteAccountRow(): ReactNode {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <section aria-label="Excluir conta" className="rounded-2xl border border-destructive/35">
            <SettingsRow
                label="Excluir conta"
                description="Apaga a conta e todos os seus vídeos e cortes. Vídeos em processamento precisam ser cancelados antes."
            >
                <Button
                    variant="secondary"
                    size="sm"
                    className="bg-destructive/15 text-destructive not-disabled:hover:bg-destructive/25"
                    onClick={() => setIsDialogOpen(true)}
                >
                    <TrashIcon aria-hidden="true" />
                    Excluir conta
                </Button>
            </SettingsRow>
            <DeleteAccountDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </section>
    );
}
