import ArrowRightIcon from "~icons/lucide/arrow-right";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import type { ReactNode } from "react";
import {
    NEW_PASSWORD_HINT,
    SIGN_UP_HONEYPOT_FIELD,
    signUpSchema,
} from "#/modules/auth/model/auth-forms";
import { authClient } from "#/modules/auth/client/auth-client";
import { runAuthRequest } from "#/modules/auth/client/run-auth-request";
import { AuthCard } from "#/modules/auth/ui/components/auth-card";
import { CaptchaField } from "#/modules/auth/ui/components/captcha-field";
import { CheckEmailCard } from "#/modules/auth/ui/components/check-email-card";
import { HoneypotField } from "#/modules/auth/ui/components/honeypot-field";
import { CAPTCHA_PENDING_MESSAGE, useCaptcha } from "#/modules/auth/ui/hooks/use-captcha";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { focusFirstInvalidField } from "#/shared/ui/focus-first-invalid-field";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { TextField } from "#/shared/ui/text-field";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

/** In page order; each field's input id matches its name. */
const FIELD_NAMES = ["name", "email", "password"] as const;
const SIGN_IN_PATH = "/sign-in";

interface SignUpScreenProps {
    /** Cloudflare Turnstile site key; null when the check is turned off. */
    captchaSiteKey: string | null;
}

export function SignUpScreen({ captchaSiteKey }: SignUpScreenProps): ReactNode {
    const track = useTrackPromise();
    const captcha = useCaptcha(captchaSiteKey);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [sentToEmail, setSentToEmail] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { name: "", email: "", password: "", [SIGN_UP_HONEYPOT_FIELD]: "" },
        validators: { onSubmit: signUpSchema },
        onSubmitInvalid: ({ formApi }) => focusFirstInvalidField(FIELD_NAMES, formApi),
        onSubmit: async ({ value }) => {
            setErrorMessage(null);

            if (captcha.isWaitingForToken() === true) {
                setErrorMessage(CAPTCHA_PENDING_MESSAGE);
                return;
            }

            const fetchOptions = { headers: captcha.buildHeaders() };
            // The link signs the person in and lands on /sign-in, which forwards a session to the
            // app; a failed link lands there with ?error.
            const failure = await runAuthRequest(() =>
                authClient.signUp.email({ ...value, callbackURL: SIGN_IN_PATH, fetchOptions }),
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
        return <CheckEmailCard email={sentToEmail} />;
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
                            id="email"
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
