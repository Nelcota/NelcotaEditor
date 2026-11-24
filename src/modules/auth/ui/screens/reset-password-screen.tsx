import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { NEW_PASSWORD_HINT, resetPasswordSchema } from "#/modules/auth/model/auth-forms";
import { authClient } from "#/modules/auth/client/auth-client";
import { runAuthRequest } from "#/modules/auth/client/run-auth-request";
import { AuthCard } from "#/modules/auth/ui/components/auth-card";
import { Alert } from "#/shared/ui/alert";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { focusFirstInvalidField } from "#/shared/ui/focus-first-invalid-field";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { TextField } from "#/shared/ui/text-field";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

const FIELD_NAMES = ["newPassword"] as const;

const CARD_TEXT = {
    eyebrow: "Nova senha",
    title: { lead: "Escolha uma", emphasis: "nova senha" },
    description: "Depois de salvar, entre com a nova senha em todos os aparelhos.",
} as const;

interface ResetPasswordScreenProps {
    /** From the email's link; null when Better Auth found the link expired or used. */
    token: string | null;
}

function ExpiredLinkNotice(): ReactNode {
    return (
        <AuthCard
            {...CARD_TEXT}
            footer={{
                text: "Precisa de outro?",
                linkLabel: "Pedir novo link",
                linkTo: "/forgot-password",
            }}
        >
            <Alert tone="danger">Este link expirou ou já foi usado.</Alert>
        </AuthCard>
    );
}

function ResetPasswordForm({ token }: { token: string }): ReactNode {
    const track = useTrackPromise();
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { newPassword: "" },
        validators: { onSubmit: resetPasswordSchema },
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
        <AuthCard
            {...CARD_TEXT}
            footer={{ text: "Lembrou a senha?", linkLabel: "Entrar", linkTo: "/sign-in" }}
        >
            <form
                noValidate
                className="grid gap-4"
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
                            className="h-11"
                            disabled={isSubmitting}
                            aria-busy={isSubmitting}
                        >
                            {isSubmitting === true && "Salvando…"}
                            {isSubmitting === false && "Salvar nova senha"}
                        </Button>
                    )}
                </form.Subscribe>
            </form>
        </AuthCard>
    );
}

export function ResetPasswordScreen({ token }: ResetPasswordScreenProps): ReactNode {
    if (token === null) {
        return <ExpiredLinkNotice />;
    }

    return <ResetPasswordForm token={token} />;
}
