import ArrowRightIcon from "~icons/lucide/arrow-right";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { signInSchema } from "#/modules/auth/model/auth-forms";
import { authClient } from "#/modules/auth/client/auth-client";
import { runAuthRequest } from "#/modules/auth/client/run-auth-request";
import { AuthCard } from "#/modules/auth/ui/components/auth-card";
import { CaptchaField } from "#/modules/auth/ui/components/captcha-field";
import { CAPTCHA_PENDING_MESSAGE, useCaptcha } from "#/modules/auth/ui/hooks/use-captcha";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { focusFirstInvalidField } from "#/shared/ui/focus-first-invalid-field";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { TextField } from "#/shared/ui/text-field";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

/** In page order; each field's input id matches its name. */
const FIELD_NAMES = ["email", "password"] as const;

interface SignInScreenProps {
    /** Cloudflare Turnstile site key; null when the check is turned off. */
    captchaSiteKey: string | null;
    /** A path inside the app, already checked; the page that sent the user here, or home. */
    redirectTarget: string;
}

export function SignInScreen({ captchaSiteKey, redirectTarget }: SignInScreenProps): ReactNode {
    const track = useTrackPromise();
    const router = useRouter();
    const captcha = useCaptcha(captchaSiteKey);
    const queryClient = useQueryClient();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { email: "", password: "" },
        validators: { onSubmit: signInSchema },
        onSubmitInvalid: ({ formApi }) => focusFirstInvalidField(FIELD_NAMES, formApi),
        onSubmit: async ({ value }) => {
            setErrorMessage(null);

            if (captcha.isWaitingForToken() === true) {
                setErrorMessage(CAPTCHA_PENDING_MESSAGE);
                return;
            }

            const fetchOptions = { headers: captcha.buildHeaders() };
            const failure = await runAuthRequest(() =>
                authClient.signIn.email({ ...value, fetchOptions }),
            );

            if (failure !== null) {
                captcha.renew();
                setErrorMessage(failure);
                return;
            }

            // A session that expired in this tab may have left another account's videos cached.
            queryClient.clear();
            await router.navigate({ href: redirectTarget });
        },
    });

    return (
        <AuthCard
            eyebrow="Entrar"
            title={{ lead: "Que bom", emphasis: "te ver de novo" }}
            description="Seus vídeos e cortes estão te esperando."
            footer={{ text: "Ainda não tem conta?", linkLabel: "Criar conta", linkTo: "/sign-up" }}
        >
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
                            autoComplete="current-password"
                            enterKeyHint="go"
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
                            {isSubmitting === true && "Entrando…"}
                            {isSubmitting === false && "Entrar"}
                            {isSubmitting === false && <ArrowRightIcon aria-hidden="true" />}
                        </Button>
                    )}
                </form.Subscribe>
            </form>
        </AuthCard>
    );
}
