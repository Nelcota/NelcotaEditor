import TrashIcon from "~icons/lucide/trash";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { deleteAccountSchema } from "#/modules/auth/model/auth-forms";
import { authClient } from "#/modules/auth/client/auth-client";
import { runAuthRequest } from "#/modules/auth/client/run-auth-request";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { Dialog, DialogClose, DialogContent } from "#/shared/ui/dialog";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { LossList } from "#/shared/ui/loss-list";
import { StepBackButton } from "#/shared/ui/step-back-button";
import {
    STEP_DIALOG_CONTENT_CLASS,
    STEP_DIALOG_WIDE_CLASS,
    StepDialogFrame,
} from "#/shared/ui/step-dialog-frame";
import { StepRail } from "#/shared/ui/step-rail";
import { TextField } from "#/shared/ui/text-field";
import { useSteps } from "#/shared/ui/use-steps";
import { useTrackPromise } from "#/shared/ui/use-track-promise";
import { focusWhenShown } from "#/shared/ui/focus-when-shown";
import { FORM_VALIDATION_LOGIC } from "#/shared/ui/form-validation-logic";

const STEPS = [
    {
        title: "O que some",
        hint: "Confira antes",
        heading: "Isto vai sumir para sempre",
        description: "Não tem lixeira. Os cortes que você já baixou continuam no seu aparelho.",
    },
    {
        title: "Confirmar",
        hint: "Com a sua senha",
        heading: "Confirme com a sua senha",
        description: "Depois disso a conta é apagada na hora. Não dá para desfazer.",
    },
] as const;

const CONFIRM_INDEX = 1;

const ACCOUNT_LOSSES = [
    { label: "Vídeos e cortes", detail: "todos" },
    { label: "Transcrições", detail: "todas" },
    { label: "Links públicos dos cortes", detail: "param de abrir" },
    { label: "Foto de perfil e login", detail: "apagados" },
];

/** Better Auth checks the password again on the server before deleting anything. */
function useDeleteAccountForm() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { password: "" },
        validationLogic: FORM_VALIDATION_LOGIC,
        validators: { onDynamic: deleteAccountSchema },
        onSubmit: async ({ value }) => {
            setErrorMessage(null);
            const failure = await runAuthRequest(() =>
                authClient.deleteUser({ password: value.password }),
            );

            if (failure !== null) {
                setErrorMessage(failure);
                return;
            }

            await router.navigate({ to: "/sign-up" });
            // The cached videos and clips belonged to the account that no longer exists.
            queryClient.clear();
        },
    });

    return { form, errorMessage };
}

interface DeleteFooterProps {
    isConfirmStep: boolean;
    isSubmitting: boolean;
    onBack: () => void;
}

function DeleteFooter({ isConfirmStep, isSubmitting, onBack }: DeleteFooterProps): ReactNode {
    if (isConfirmStep === false) {
        return (
            <>
                <DialogClose asChild>
                    <Button type="button" variant="ghost" className="text-muted-foreground">
                        Cancelar
                    </Button>
                </DialogClose>
                <Button
                    type="submit"
                    size="lg"
                    variant="destructive"
                    className="ms-auto max-sm:flex-1"
                >
                    Entendi, continuar
                </Button>
            </>
        );
    }

    return (
        <>
            <StepBackButton onClick={onBack} />
            <Button
                type="submit"
                size="lg"
                variant="destructive"
                className="ms-auto max-sm:flex-1"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
            >
                Excluir conta para sempre
            </Button>
        </>
    );
}

function DeleteAccountSteps(): ReactNode {
    const track = useTrackPromise();
    const steps = useSteps(STEPS);
    const step = steps.current;
    const isConfirmStep = steps.index === CONFIRM_INDEX;
    const { form, errorMessage } = useDeleteAccountForm();

    const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();

        if (isConfirmStep === false) {
            steps.goNext();
            return;
        }

        await form.handleSubmit();
    };

    return (
        <form noValidate onSubmit={(event) => track(submit(event))} className="grid min-h-0">
            <StepDialogFrame
                kind="dialog"
                rail={
                    <StepRail
                        title="Excluir conta"
                        icon={TrashIcon}
                        tone="danger"
                        steps={STEPS}
                        currentIndex={steps.index}
                        reachableIndex={steps.reachableIndex}
                        onStepSelect={steps.goTo}
                    />
                }
                progress={{ current: steps.index + 1, total: STEPS.length }}
                title={step.heading}
                description={step.description}
                footer={
                    <form.Subscribe selector={(state) => state.isSubmitting}>
                        {(isSubmitting) => (
                            <DeleteFooter
                                isConfirmStep={isConfirmStep}
                                isSubmitting={isSubmitting}
                                onBack={steps.goBack}
                            />
                        )}
                    </form.Subscribe>
                }
            >
                {isConfirmStep === false && <LossList items={ACCOUNT_LOSSES} />}
                {isConfirmStep === true && (
                    <form.Field name="password">
                        {(field) => (
                            <TextField
                                id="delete-account-password"
                                label="Senha"
                                type="password"
                                autoComplete="current-password"
                                ref={focusWhenShown}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onValueChange={field.handleChange}
                                errors={toErrorMessages(field.state.meta.errors)}
                            />
                        )}
                    </form.Field>
                )}
                {isConfirmStep === true && <FormAlert message={errorMessage} />}
            </StepDialogFrame>
        </form>
    );
}

interface DeleteAccountDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

/** Permanent, so it first lists what goes away, then asks for the password. */
export function DeleteAccountDialog({ isOpen, onOpenChange }: DeleteAccountDialogProps): ReactNode {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className={cn(STEP_DIALOG_CONTENT_CLASS, STEP_DIALOG_WIDE_CLASS)}>
                <DeleteAccountSteps />
            </DialogContent>
        </Dialog>
    );
}
