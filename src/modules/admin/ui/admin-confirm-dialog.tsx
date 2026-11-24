import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { invalidateAdminQueries } from "#/modules/admin/ui/admin-queries";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
} from "#/shared/ui/alert-dialog";
import { cn } from "#/shared/ui/cn";
import { FormAlert } from "#/shared/ui/form-alert";
import {
    STEP_DIALOG_CONTENT_CLASS,
    STEP_DIALOG_SINGLE_CLASS,
    StepDialogFrame,
} from "#/shared/ui/step-dialog-frame";
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
            <AlertDialogContent className={cn(STEP_DIALOG_CONTENT_CLASS, STEP_DIALOG_SINGLE_CLASS)}>
                <StepDialogFrame
                    kind="alert"
                    rail={null}
                    progress={null}
                    title={confirmation?.title}
                    description={confirmation?.description}
                    footer={
                        <>
                            <AlertDialogCancel variant="ghost" className="text-muted-foreground">
                                Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                                variant={variant}
                                size="lg"
                                className="ms-auto font-medium max-sm:flex-1"
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
                        </>
                    }
                >
                    {children}
                    {action.isError === true && (
                        <FormAlert message={toErrorMessage(action.error, FALLBACK_ERROR_MESSAGE)} />
                    )}
                </StepDialogFrame>
            </AlertDialogContent>
        </AlertDialog>
    );
}
