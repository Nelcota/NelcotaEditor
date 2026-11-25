import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import type { ReactNode } from "react";
import { forgotPasswordSchema } from "#/modules/auth/model/auth-forms";
import { authClient } from "#/modules/auth/client/auth-client";
import { runAuthRequest } from "#/modules/auth/client/run-auth-request";
import { AuthCard } from "#/modules/auth/ui/components/auth-card";
import { buildCaptchaHeaders } from "#/modules/auth/client/captcha-headers";
import { CaptchaField } from "#/shared/ui/captcha-field";
import { CAPTCHA_PENDING_MESSAGE, useCaptcha } from "#/shared/ui/use-captcha";
import { Alert } from "#/shared/ui/alert";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { focusFirstInvalidField } from "#/shared/ui/focus-first-invalid-field";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { TextField } from "#/shared/ui/text-field";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

const FIELD_NAMES = ["email"] as const;
/** The email's link opens Better Auth, which forwards a valid token to this screen. */
const RESET_PASSWORD_PATH = "/reset-password";

const CARD_TEXT = {
    eyebrow: "Recuperar senha",
    title: { lead: "Esqueceu a", emphasis: "senha" },
    description: "Digite o email da sua conta. Enviamos um link para criar uma nova senha.",
    footer: { text: "Lembrou?", linkLabel: "Entrar", linkTo: "/sign-in" },
} as const;

interface ForgotPasswordScreenProps {
    /** Cloudflare Turnstile site key; null when the check is turned off. */
    captchaSiteKey: string | null;
}

/** The answer is the same whether or not the email has an account. */
function SentNotice({ email }: { email: string }): ReactNode {
    return (
        <AuthCard {...CARD_TEXT}>
            <Alert tone="info">
                Se existir uma conta com {email}, enviamos um link para criar uma nova senha. Ele
                vale por 1 hora. Confira também o spam.
            </Alert>
        </AuthCard>
    );
}

export function ForgotPasswordScreen({ captchaSiteKey }: ForgotPasswordScreenProps): ReactNode {
    const track = useTrackPromise();
    const captcha = useCaptcha(captchaSiteKey);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [sentToEmail, setSentToEmail] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { email: "" },
        validators: { onSubmit: forgotPasswordSchema },
        onSubmitInvalid: ({ formApi }) => focusFirstInvalidField(FIELD_NAMES, formApi),
        onSubmit: async ({ value }) => {
            setErrorMessage(null);

            if (captcha.isWaitingForToken() === true) {
                setErrorMessage(CAPTCHA_PENDING_MESSAGE);
                return;
            }

            const fetchOptions = { headers: buildCaptchaHeaders(captcha.readToken()) };
            const failure = await runAuthRequest(() =>
                authClient.requestPasswordReset({
                    email: value.email,
                    redirectTo: RESET_PASSWORD_PATH,
                    fetchOptions,
                }),
            );

            if (failure !== null) {
                captcha.renew();
                setErrorMessage(failure);
                return;
            }

            setSentToEmail(value.email);
        },
    });

    if (sentToEmail !== null) {
        return <SentNotice email={sentToEmail} />;
    }

    return (
        <AuthCard {...CARD_TEXT}>
            <form
                noValidate
                className="grid gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    track(form.handleSubmit());
                }}
            >
                <form.Field name="email">
                    {(field) => (
                        <TextField
                            id="email"
                            label="Email"
                            type="email"
                            autoComplete="email"
                            spellCheck={false}
                            autoCapitalize="none"
                            enterKeyHint="send"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onValueChange={field.handleChange}
                            errors={toErrorMessages(field.state.meta.errors)}
                        />
                    )}
                </form.Field>
                <CaptchaField captcha={captcha} />
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
                            {isSubmitting === true && "Enviando…"}
                            {isSubmitting === false && "Enviar link"}
                        </Button>
                    )}
                </form.Subscribe>
            </form>
        </AuthCard>
    );
}
