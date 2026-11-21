import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { invalidateAdminQueries } from "#/modules/admin/ui/admin-queries";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "#/shared/ui/alert-dialog";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const FALLBACK_ERROR_MESSAGE = "Não foi possível concluir. Confira sua conexão e tente de novo.";

export interface AdminConfirmation {
    title: string;
    description: ReactNode;
    confirmLabel: string;
    isDestructive: boolean;
    run: () => Promise<void>;
    /** After it worked, before the lists refresh: for example, leaving a page that no longer exists. */
    onDone?: () => Promise<void>;
}

interface AdminConfirmDialogProps {
    confirmation: AdminConfirmation | null;
    onClose: () => void;
    children?: ReactNode;
}

/** Every admin action that changes someone else's account or video asks first and names it. */
export function AdminConfirmDialog({
    confirmation,
    onClose,
    children,
}: AdminConfirmDialogProps): ReactNode {
    const queryClient = useQueryClient();
    const action = useMutation({
        mutationFn: async (current: AdminConfirmation) => {
            await current.run();
            // Leaving first: refreshing the page of an account that was just deleted would retry
            // its query for seconds before the lists update.
            await current.onDone?.();
            await invalidateAdminQueries(queryClient);
        },
        onSuccess: onClose,
    });

    let variant: "default" | "destructive" = "default";

    if (confirmation?.isDestructive === true) {
        variant = "destructive";
    }

    return (
        <AlertDialog
            open={confirmation !== null}
            onOpenChange={(isOpen) => {
                if (isOpen === false) {
                    action.reset();
                    onClose();
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{confirmation?.title}</AlertDialogTitle>
                    <AlertDialogDescription>{confirmation?.description}</AlertDialogDescription>
                </AlertDialogHeader>
                {children}
                {action.isError === true && (
                    <FormAlert message={toErrorMessage(action.error, FALLBACK_ERROR_MESSAGE)} />
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        variant={variant}
                        disabled={action.isPending}
                        aria-busy={action.isPending}
                        onClick={(event) => {
                            event.preventDefault();

                            if (confirmation === null) {
                                return;
                            }

                            action.mutate(confirmation);
                        }}
                    >
                        {confirmation?.confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
