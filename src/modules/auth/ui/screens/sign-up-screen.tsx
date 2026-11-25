import ArrowRightIcon from "~icons/lucide/arrow-right";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { flushSync } from "react-dom";
import type { ReactNode } from "react";
import {
    NEW_PASSWORD_HINT,
    SIGN_UP_HONEYPOT_FIELD,
    signUpSchema,
} from "#/modules/auth/model/auth-forms";
import { toAuthErrorMessage } from "#/modules/auth/model/auth-error-message";
import { authClient } from "#/modules/auth/client/auth-client";
import { runAuthRequest } from "#/modules/auth/client/run-auth-request";
import { AccountCreatedCard } from "#/modules/auth/ui/components/account-created-card";
import { AuthCard } from "#/modules/auth/ui/components/auth-card";
import { buildCaptchaHeaders } from "#/modules/auth/client/captcha-headers";
import { CaptchaField } from "#/shared/ui/captcha-field";
import { CheckEmailCard } from "#/modules/auth/ui/components/check-email-card";
import { HoneypotField } from "#/shared/ui/honeypot-field";
import { CAPTCHA_PENDING_MESSAGE, useCaptcha } from "#/shared/ui/use-captcha";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { focusFirstInvalidField } from "#/shared/ui/focus-first-invalid-field";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { TextField } from "#/shared/ui/text-field";
import { useTrackPromise } from "#/shared/ui/use-track-promise";
import { FORM_VALIDATION_LOGIC } from "#/shared/ui/form-validation-logic";

/** In page order; each field's input id matches its name. */
const FIELD_NAMES = ["name", "email", "password"] as const;
const SIGN_IN_PATH = "/sign-in";

/**
 * Server rejections that belong to one field show on it. A taken email never lands here: sign-up
 * answers it as a success, so nobody learns which addresses have accounts.
 */
const SERVER_ERROR_FIELDS = new Map<string, (typeof FIELD_NAMES)[number]>([
    [toAuthErrorMessage("INVALID_EMAIL"), "email"],
    [toAuthErrorMessage("PASSWORD_TOO_SHORT"), "password"],
    [toAuthErrorMessage("PASSWORD_TOO_LONG"), "password"],
]);

const EMAIL_FIELD_ID = "email";

interface SignUpScreenProps {
    /** Cloudflare Turnstile site key; null when the check is turned off. */
    captchaSiteKey: string | null;
    /** Off when an admin turned the email-verification switch off: the account opens right away. */
    isEmailVerificationRequired: boolean;
}

export function SignUpScreen({
    captchaSiteKey,
    isEmailVerificationRequired,
}: SignUpScreenProps): ReactNode {
    const track = useTrackPromise();
    const captcha = useCaptcha(captchaSiteKey);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [sentToEmail, setSentToEmail] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { name: "", email: "", password: "", [SIGN_UP_HONEYPOT_FIELD]: "" },
        validationLogic: FORM_VALIDATION_LOGIC,
        validators: { onDynamic: signUpSchema },
        onSubmitInvalid: ({ formApi }) => focusFirstInvalidField(FIELD_NAMES, formApi),
        onSubmit: async ({ value, formApi }) => {
            setErrorMessage(null);

            if (captcha.isWaitingForToken() === true) {
                setErrorMessage(CAPTCHA_PENDING_MESSAGE);
                return;
            }

            const fetchOptions = { headers: buildCaptchaHeaders(captcha.readToken()) };
            // The link signs the person in and lands on /sign-in, which forwards a session to the
            // app; a failed link lands there with ?error.
            const failure = await runAuthRequest(() =>
                authClient.signUp.email({ ...value, callbackURL: SIGN_IN_PATH, fetchOptions }),
            );

            if (failure === null) {
                setSentToEmail(value.email);
                return;
            }

            captcha.renew();
            const fieldName = SERVER_ERROR_FIELDS.get(failure);

            if (fieldName !== undefined) {
                formApi.setErrorMap({ onSubmit: { fields: { [fieldName]: failure } } });
                focusFirstInvalidField(FIELD_NAMES, formApi);
                return;
            }

            setErrorMessage(failure);
        },
    });

    if (sentToEmail !== null && isEmailVerificationRequired === false) {
        return <AccountCreatedCard />;
    }

    if (sentToEmail !== null) {
        // Back on the form, still filled in, with the cursor in the address to fix.
        const changeEmail = (): void => {
            flushSync(() => setSentToEmail(null));
            document.getElementById(EMAIL_FIELD_ID)?.focus();
        };

        return <CheckEmailCard email={sentToEmail} onChangeEmail={changeEmail} />;
    }

    return (
        <AuthCard
            eyebrow="Criar conta"
            title={{ lead: "Comece a", emphasis: "cortar seus vídeos" }}
            description="Transforme vídeos longos em cortes verticais com legenda."
            footer={{ text: "Já tem conta?", linkLabel: "Entrar", linkTo: "/sign-in" }}
        >
            <form
                noValidate
                className="grid gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    track(form.handleSubmit());
                }}
            >
                <form.Field name="name">
                    {(field) => (
                        <TextField
                            id="name"
                            label="Nome"
                            autoComplete="name"
                            autoCapitalize="words"
                            enterKeyHint="next"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onValueChange={field.handleChange}
                            errors={toErrorMessages(field.state.meta.errors)}
                        />
                    )}
                </form.Field>
                <form.Field name="email">
                    {(field) => (
                        <TextField
                            id={EMAIL_FIELD_ID}
                            label="Email"
                            type="email"
                            autoComplete="email"
                            spellCheck={false}
                            autoCapitalize="none"
                            enterKeyHint="next"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onValueChange={field.handleChange}
                            errors={toErrorMessages(field.state.meta.errors)}
                        />
                    )}
                </form.Field>
                <form.Field name="password">
                    {(field) => (
                        <TextField
                            id="password"
                            label="Senha"
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
                <form.Field name={SIGN_UP_HONEYPOT_FIELD}>
                    {(field) => (
                        <HoneypotField
                            name={field.name}
                            value={field.state.value}
                            onValueChange={field.handleChange}
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
                            {isSubmitting === true && "Criando conta…"}
                            {isSubmitting === false && "Criar conta"}
                            {isSubmitting === false && <ArrowRightIcon aria-hidden="true" />}
                        </Button>
                    )}
                </form.Subscribe>
            </form>
        </AuthCard>
    );
}
