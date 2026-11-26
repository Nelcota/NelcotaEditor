import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import { mySubscriptionQueryOptions } from "#/modules/billing/model/subscription-queries";
import { cancelMySubscription } from "#/modules/billing/server/subscription-functions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
} from "#/shared/ui/alert-dialog";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { FormAlert } from "#/shared/ui/form-alert";
import {
    STEP_DIALOG_CONTENT_CLASS,
    STEP_DIALOG_SINGLE_CLASS,
    StepDialogFrame,
} from "#/shared/ui/step-dialog-frame";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const FALLBACK_ERROR_MESSAGE =
    "Não foi possível cancelar agora. Confira sua conexão e tente de novo.";

/** Asks before stopping the monthly charge and says what stays: the days already paid. */
export function CancelSubscriptionDialog({ accessEndsOn }: { accessEndsOn: string }): ReactNode {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const cancel = useMutation({
        mutationFn: async () => await cancelMySubscription(),
        onSuccess: async () => {
            setIsOpen(false);
            await queryClient.invalidateQueries(mySubscriptionQueryOptions());
        },
    });

    return (
        <AlertDialog
            open={isOpen}
            onOpenChange={(nextIsOpen) => {
                cancel.reset();
                setIsOpen(nextIsOpen);
            }}
        >
            <Button type="button" variant="ghost" onClick={() => setIsOpen(true)}>
                Cancelar assinatura
            </Button>
            <AlertDialogContent className={cn(STEP_DIALOG_CONTENT_CLASS, STEP_DIALOG_SINGLE_CLASS)}>
                <StepDialogFrame
                    kind="alert"
                    rail={null}
                    progress={null}
                    title="Cancelar a assinatura?"
                    description={`Não haverá novas cobranças. Os formatos de assinante continuam liberados até ${accessEndsOn}.`}
                    footer={
                        <>
                            <AlertDialogCancel variant="ghost" className="text-muted-foreground">
                                Manter assinatura
                            </AlertDialogCancel>
                            <AlertDialogAction
                                variant="destructive"
                                size="lg"
                                className="ms-auto font-medium max-sm:flex-1"
                                disabled={cancel.isPending}
                                aria-busy={cancel.isPending}
                                onClick={(event) => {
                                    event.preventDefault();
                                    cancel.mutate();
                                }}
                            >
                                Cancelar assinatura
                            </AlertDialogAction>
                        </>
                    }
                >
                    {cancel.isError === true && (
                        <FormAlert message={toErrorMessage(cancel.error, FALLBACK_ERROR_MESSAGE)} />
                    )}
                </StepDialogFrame>
            </AlertDialogContent>
        </AlertDialog>
    );
}
