import ArrowRightIcon from "~icons/lucide/arrow-right";
import UserRoundIcon from "~icons/lucide/user-round";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { profileNameSchema } from "#/modules/auth/model/auth-forms";
import { renameUser } from "#/modules/auth/server/profile-functions";
import { AvatarStep } from "#/modules/auth/ui/components/avatar-step";
import { forgetCurrentUser } from "#/modules/auth/model/current-user-query";
import { ReadOnlyEmail } from "#/modules/auth/ui/components/read-only-email";
import { Button } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { Dialog, DialogContent } from "#/shared/ui/dialog";
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

const appRoute = getRouteApi("/_app");
const SAVE_FAILED_MESSAGE = "Não foi possível salvar o nome. Tente novamente.";

const STEPS = [
    {
        title: "Foto",
        hint: "Foto ou mascote",
        heading: "Escolha sua foto",
        description: "Envie uma foto ou use um mascote. A troca vale na hora.",
    },
    {
        title: "Nome",
        hint: "Como você aparece",
        heading: "Como devemos te chamar?",
        description: "O nome aparece na barra lateral.",
    },
] as const;

const NAME_STEP_INDEX = 1;

export type ProfileStep = "photo" | "name";

const STEP_INDEXES: Record<ProfileStep, number> = { photo: 0, name: NAME_STEP_INDEX };

function toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return SAVE_FAILED_MESSAGE;
}

/** The name form: saves through the server, then reloads the signed-in user to show it. */
function useProfileNameForm(onDone: () => void) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const routeContext = appRoute.useRouteContext();
    const user = routeContext.user;
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { name: user.name },
        validators: { onSubmit: profileNameSchema },
        onSubmit: async ({ value }) => {
            setErrorMessage(null);

            try {
                await renameUser({ data: value });
            } catch (error) {
                setErrorMessage(toErrorMessage(error));
                return;
            }

            await forgetCurrentUser(queryClient);
            await router.invalidate();
            onDone();
        },
    });

    return { form, errorMessage, email: user.email };
}

interface ProfileStepsProps {
    initialStep: ProfileStep;
    onDone: () => void;
}

function ProfileSteps({ initialStep, onDone }: ProfileStepsProps): ReactNode {
    const steps = useSteps(STEPS.length, STEP_INDEXES[initialStep]);
    const step = STEPS[steps.index];
    const { form, errorMessage, email } = useProfileNameForm(onDone);
    const isNameStep = steps.index === NAME_STEP_INDEX;

    const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();

        if (isNameStep === false) {
            steps.goNext();
            return;
        }

        await form.handleSubmit();
    };

    return (
        <form noValidate onSubmit={submit} className="grid min-h-0">
            <StepDialogFrame
                kind="dialog"
                rail={
                    <StepRail
                        title="Seu perfil"
                        icon={UserRoundIcon}
                        tone="default"
                        steps={STEPS}
                        currentIndex={steps.index}
                        reachableIndex={STEPS.length - 1}
                        onStepSelect={steps.goTo}
                    />
                }
                progress={{ current: steps.index + 1, total: STEPS.length }}
                title={step.heading}
                description={step.description}
                footer={
                    <form.Subscribe selector={(state) => state.isSubmitting}>
                        {(isSubmitting) => (
                            <ProfileFooter
                                isNameStep={isNameStep}
                                isSubmitting={isSubmitting}
                                onBack={steps.goBack}
                            />
                        )}
                    </form.Subscribe>
                }
            >
                {isNameStep === false && <AvatarStep />}
                {isNameStep === true && (
                    <form.Field name="name">
                        {(field) => (
                            <TextField
                                id="profile-name"
                                label="Nome"
                                autoComplete="name"
                                autoCapitalize="words"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onValueChange={field.handleChange}
                                errors={toErrorMessages(field.state.meta.errors)}
                            />
                        )}
                    </form.Field>
                )}
                {isNameStep === true && <ReadOnlyEmail email={email} />}
                {isNameStep === true && <FormAlert message={errorMessage} />}
            </StepDialogFrame>
        </form>
    );
}

interface ProfileFooterProps {
    isNameStep: boolean;
    isSubmitting: boolean;
    onBack: () => void;
}

function ProfileFooter({ isNameStep, isSubmitting, onBack }: ProfileFooterProps): ReactNode {
    if (isNameStep === false) {
        return (
            <Button type="submit" size="lg" className="ms-auto font-medium max-sm:flex-1">
                Continuar
                <ArrowRightIcon aria-hidden="true" />
            </Button>
        );
    }

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
                Salvar nome
            </Button>
        </>
    );
}

interface ProfileDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    initialStep: ProfileStep;
}

/** Photo and name in one dialog; it opens on whichever step the person asked for. */
export function ProfileDialog({
    isOpen,
    onOpenChange,
    initialStep,
}: ProfileDialogProps): ReactNode {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className={cn(STEP_DIALOG_CONTENT_CLASS, STEP_DIALOG_WIDE_CLASS)}>
                <ProfileSteps initialStep={initialStep} onDone={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}
