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
import { AuthEntryLayout } from "#/modules/auth/ui/components/auth-entry-layout";
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
        <AuthEntryLayout
            title="Criar conta"
            accountLink={{ text: "Já tem conta?", label: "Entrar", to: "/sign-in" }}
        >
            <form
                method="post"
                noValidate
                className="grid gap-5"
                onSubmit={(event) => {
                    event.preventDefault();
                    track(form.handleSubmit());
                }}
            >
                <form.Field name="name">
                    {(field) => (
                        <TextField
                            id="name"
                            name="name"
                            label="Nome"
                            autoComplete="name"
                            required
                            autoCapitalize="words"
                            enterKeyHint="next"
                            className="h-12"
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
                            name="email"
                            label="Email"
                            type="email"
                            autoComplete="username"
                            required
                            spellCheck={false}
                            autoCapitalize="none"
                            enterKeyHint="next"
                            className="h-12"
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
                            name="password"
                            label="Senha"
                            type="password"
                            autoComplete="new-password"
                            required
                            enterKeyHint="go"
                            className="h-12"
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
                            className="h-12 justify-between font-semibold"
                            isLoading={isSubmitting}
                            loadingLabel="Criando conta…"
                        >
                            Criar conta
                            <ArrowRightIcon aria-hidden="true" className="size-4" />
                        </Button>
                    )}
                </form.Subscribe>
            </form>
        </AuthEntryLayout>
    );
}
