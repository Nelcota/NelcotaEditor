import ArrowRightIcon from "~icons/lucide/arrow-right";
import CircleCheckIcon from "~icons/lucide/circle-check";
import KeyRoundIcon from "~icons/lucide/key-round";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { changePasswordSchema, NEW_PASSWORD_HINT } from "#/modules/auth/model/auth-forms";
import { authClient } from "#/modules/auth/client/auth-client";
import { toAuthErrorMessage } from "#/modules/auth/model/auth-error-message";
import { runAuthRequest } from "#/modules/auth/client/run-auth-request";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { Dialog, DialogClose, DialogContent } from "#/shared/ui/dialog";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessages } from "#/shared/ui/form-errors";
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

const STEPS = [
    {
        title: "Senha atual",
        hint: "Para confirmar que é você",
        heading: "Qual é a sua senha de agora?",
        description: "Só para confirmar que é você mesmo.",
    },
    {
        title: "Senha nova",
        hint: "A que você vai usar",
        heading: "Escolha a senha nova",
        description: "Por segurança, os outros aparelhos onde você entrou saem da conta.",
    },
    {
        title: "Pronto",
        hint: "Senha trocada",
        heading: "Senha trocada",
        description: "Na próxima vez que entrar, use a senha nova.",
    },
] as const;

const NEW_PASSWORD_INDEX = 1;
const DONE_INDEX = 2;
const CURRENT_PASSWORD_MISSING = "Digite a senha que você usa hoje.";

const CURRENT_PASSWORD_REJECTED = toAuthErrorMessage("INVALID_PASSWORD");

interface ChangePasswordCallbacks {
    onChanged: () => void;
    /** The current password was wrong: its own step has the field to fix. */
    onCurrentPasswordRejected: () => void;
}

/** Better Auth checks the current password and the new one's length again on the server. */
function useChangePasswordForm(callbacks: ChangePasswordCallbacks) {
    const { onChanged, onCurrentPasswordRejected } = callbacks;
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { currentPassword: "", newPassword: "" },
        validators: { onSubmit: changePasswordSchema },
        onSubmit: async ({ value }) => {
            setErrorMessage(null);
            const failure = await runAuthRequest(() =>
                authClient.changePassword({ ...value, revokeOtherSessions: true }),
            );

            if (failure === CURRENT_PASSWORD_REJECTED) {
                setErrorMessage(failure);
                onCurrentPasswordRejected();
                return;
            }

            if (failure !== null) {
                setErrorMessage(failure);
                return;
            }

            onChanged();
        },
    });

    return { form, errorMessage, setErrorMessage };
}

interface PasswordFooterProps {
    index: number;
    isSubmitting: boolean;
    onBack: () => void;
}

function PasswordFooter({ index, isSubmitting, onBack }: PasswordFooterProps): ReactNode {
    if (index === DONE_INDEX) {
        return (
            <DialogClose asChild>
                <Button type="button" size="lg" className="ms-auto font-medium max-sm:flex-1">
                    Concluir
                </Button>
            </DialogClose>
        );
    }

    if (index === NEW_PASSWORD_INDEX) {
        return (
            <>
                <StepBackButton onClick={onBack} />
                <Button
                    type="submit"
                    size="lg"
                    className="ms-auto font-medium max-sm:flex-1"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                >
                    Trocar senha
                </Button>
            </>
        );
    }

    return (
        <Button type="submit" size="lg" className="ms-auto font-medium max-sm:flex-1">
            Continuar
            <ArrowRightIcon aria-hidden="true" />
        </Button>
    );
}

function DoneNote(): ReactNode {
    return (
        <p className="flex items-center gap-3 rounded-xl bg-success/10 p-4 text-sm font-medium">
            <CircleCheckIcon aria-hidden="true" className="size-5 shrink-0 text-success" />
            Tudo certo. Os outros aparelhos saíram da conta; este continua conectado.
        </p>
    );
}

function ChangePasswordSteps({ onChanged }: { onChanged: () => void }): ReactNode {
    const track = useTrackPromise();
    const steps = useSteps(STEPS);
    const step = steps.current;
    const { form, errorMessage, setErrorMessage } = useChangePasswordForm({
        onChanged: () => {
            onChanged();
            steps.goTo(DONE_INDEX);
        },
        onCurrentPasswordRejected: () => steps.goTo(0),
    });

    const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();

        if (steps.index === 0) {
            if (form.getFieldValue("currentPassword").length === 0) {
                setErrorMessage(CURRENT_PASSWORD_MISSING);
                return;
            }

            setErrorMessage(null);
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
                        title="Trocar senha"
                        icon={KeyRoundIcon}
                        tone="default"
                        steps={STEPS}
                        currentIndex={steps.index}
                        // Once changed, there is nothing to go back to.
                        reachableIndex={Math.min(steps.reachableIndex, NEW_PASSWORD_INDEX)}
                        onStepSelect={(index) => {
                            if (steps.index !== DONE_INDEX) {
                                steps.goTo(index);
                            }
                        }}
                    />
                }
                progress={{ current: steps.index + 1, total: STEPS.length }}
                title={step.heading}
                description={step.description}
                footer={
                    <form.Subscribe selector={(state) => state.isSubmitting}>
                        {(isSubmitting) => (
                            <PasswordFooter
                                index={steps.index}
                                isSubmitting={isSubmitting}
                                onBack={steps.goBack}
                            />
                        )}
                    </form.Subscribe>
                }
            >
                {steps.index === 0 && (
                    <form.Field name="currentPassword">
                        {(field) => (
                            <TextField
                                id="current-password"
                                label="Senha atual"
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
                {steps.index === NEW_PASSWORD_INDEX && (
                    <form.Field name="newPassword">
                        {(field) => (
                            <TextField
                                id="new-password"
                                label="Senha nova"
                                type="password"
                                autoComplete="new-password"
                                ref={focusWhenShown}
                                hint={NEW_PASSWORD_HINT}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onValueChange={field.handleChange}
                                errors={toErrorMessages(field.state.meta.errors)}
                            />
                        )}
                    </form.Field>
                )}
                {steps.index === DONE_INDEX && <DoneNote />}
                {steps.index !== DONE_INDEX && <FormAlert message={errorMessage} />}
            </StepDialogFrame>
        </form>
    );
}

interface ChangePasswordDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onChanged: () => void;
}

/**
 * The current password, the new one, then a confirmation. Callers close the dialog in onChanged,
 * so it runs when the person leaves the confirmation, not when the server answers.
 */
export function ChangePasswordDialog({
    isOpen,
    onOpenChange,
    onChanged,
}: ChangePasswordDialogProps): ReactNode {
    const [isChanged, setIsChanged] = useState(false);

    const handleOpenChange = (isNowOpen: boolean): void => {
        if (isNowOpen === false && isChanged === true) {
            setIsChanged(false);
            onChanged();
            return;
        }

        onOpenChange(isNowOpen);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className={cn(STEP_DIALOG_CONTENT_CLASS, STEP_DIALOG_WIDE_CLASS)}>
                <ChangePasswordSteps onChanged={() => setIsChanged(true)} />
            </DialogContent>
        </Dialog>
    );
}
