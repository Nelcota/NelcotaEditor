import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { NEW_PASSWORD_HINT, resetPasswordSchema } from "#/modules/auth/model/auth-forms";
import { authClient } from "#/modules/auth/client/auth-client";
import { runAuthRequest } from "#/modules/auth/client/run-auth-request";
import { AuthEntryLayout } from "#/modules/auth/ui/components/auth-entry-layout";
import { Alert } from "#/shared/ui/alert";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { focusFirstInvalidField } from "#/shared/ui/focus-first-invalid-field";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { TextField } from "#/shared/ui/text-field";
import { useTrackPromise } from "#/shared/ui/use-track-promise";
import { FORM_VALIDATION_LOGIC } from "#/shared/ui/form-validation-logic";

const FIELD_NAMES = ["newPassword"] as const;

const ENTRY_TEXT = {
    title: "Escolha uma nova senha",
    description: "Depois de salvar, entre com a nova senha em todos os aparelhos.",
} as const;

interface ResetPasswordScreenProps {
    /** From the email's link; null when Better Auth found the link expired or used. */
    token: string | null;
}

function ExpiredLinkNotice(): ReactNode {
    return (
        <AuthEntryLayout
            {...ENTRY_TEXT}
            accountLink={{
                text: "Precisa de outro?",
                label: "Pedir novo link",
                to: "/forgot-password",
            }}
        >
            <Alert tone="danger">Este link expirou ou já foi usado.</Alert>
        </AuthEntryLayout>
    );
}

function ResetPasswordForm({ token }: { token: string }): ReactNode {
    const track = useTrackPromise();
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { newPassword: "" },
        validationLogic: FORM_VALIDATION_LOGIC,
        validators: { onDynamic: resetPasswordSchema },
        onSubmitInvalid: ({ formApi }) => focusFirstInvalidField(FIELD_NAMES, formApi),
        onSubmit: async ({ value }) => {
            setErrorMessage(null);
            const failure = await runAuthRequest(() =>
                authClient.resetPassword({ newPassword: value.newPassword, token }),
            );

            if (failure !== null) {
                setErrorMessage(failure);
                return;
            }

            await router.navigate({ to: "/sign-in", search: { reset: "done" } });
        },
    });

    return (
        <AuthEntryLayout
            {...ENTRY_TEXT}
            accountLink={{ text: "Lembrou a senha?", label: "Entrar", to: "/sign-in" }}
        >
            <form
                noValidate
                className="grid gap-5"
                onSubmit={(event) => {
                    event.preventDefault();
                    track(form.handleSubmit());
                }}
            >
                <form.Field name="newPassword">
                    {(field) => (
                        <TextField
                            id="newPassword"
                            label="Nova senha"
                            type="password"
                            autoComplete="new-password"
                            enterKeyHint="go"
                            hint={NEW_PASSWORD_HINT}
                            className="h-12"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onValueChange={field.handleChange}
                            errors={toErrorMessages(field.state.meta.errors)}
                        />
                    )}
                </form.Field>
                <FormAlert message={errorMessage} />
                <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                        <Button
                            type="submit"
                            size="lg"
                            className="h-12 font-semibold"
                            disabled={isSubmitting}
                            aria-busy={isSubmitting}
                        >
                            {isSubmitting === true && "Salvando…"}
                            {isSubmitting === false && "Salvar nova senha"}
                        </Button>
                    )}
                </form.Subscribe>
            </form>
        </AuthEntryLayout>
    );
}

export function ResetPasswordScreen({ token }: ResetPasswordScreenProps): ReactNode {
    if (token === null) {
        return <ExpiredLinkNotice />;
    }

    return <ResetPasswordForm token={token} />;
}
