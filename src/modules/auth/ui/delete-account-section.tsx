import TrashBinTrashIcon from "~icons/solar/trash-bin-trash-linear";
import { useState } from "react";
import type { ReactNode } from "react";
import { DeleteAccountDialog } from "#/modules/auth/ui/delete-account-dialog";
import { Button } from "#/shared/ui/button";

/** The way out for good, kept apart from the everyday profile actions. */
export function DeleteAccountSection(): ReactNode {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-destructive/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            {/* The disclosure above already says "Excluir conta"; the button says it once more. */}
            <p className="max-w-prose text-sm text-muted-foreground">
                Apaga a conta e tudo o que a equipe fez para você. Vídeos em processamento precisam
                ser cancelados antes.
            </p>
            <Button
                variant="outline"
                className="font-medium text-destructive not-disabled:hover:text-destructive"
                onClick={() => setIsDialogOpen(true)}
            >
                <TrashBinTrashIcon aria-hidden="true" />
                Excluir conta
            </Button>
            <DeleteAccountDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    );
}
