import ArrowRightIcon from "~icons/lucide/arrow-right";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { signInSchema } from "#/modules/auth/model/auth-forms";
import { toSignInNotice } from "#/modules/auth/model/sign-in-notice";
import type { SignInSearch } from "#/modules/auth/model/sign-in-search";
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
import { FORM_VALIDATION_LOGIC } from "#/shared/ui/form-validation-logic";

/** In page order; each field's input id matches its name. */
const FIELD_NAMES = ["email", "password"] as const;

interface SignInScreenProps {
    /** Cloudflare Turnstile site key; null when the check is turned off. */
    captchaSiteKey: string | null;
    /** A path inside the app, already checked; the page that sent the user here, or home. */
    redirectTarget: string;
    /** Set by the link that brought the person here (email confirmation, password reset). */
    search: SignInSearch;
    /**
     * Signing in to let an app (the person's Claude) in: Better Auth resumes that request and the
     * auth client follows its redirect, so the page does not navigate on its own.
     */
    isAuthorizingApp?: boolean;
}

const SIGN_IN_TITLE = { lead: "Que bom", emphasis: "te ver de novo" };
const CONNECT_CLAUDE_TITLE = { lead: "Entre para", emphasis: "conectar o Claude" };

export function SignInScreen({
    captchaSiteKey,
    search,
    redirectTarget,
    isAuthorizingApp = false,
}: SignInScreenProps): ReactNode {
    const notice = toSignInNotice(search);
    const track = useTrackPromise();
    const router = useRouter();
    const captcha = useCaptcha(captchaSiteKey);
    const queryClient = useQueryClient();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // Set by the sign-up confirmation's link, so the person only types the password.
    const signUpEmail = useLocation({ select: (location) => location.state.signInEmail });
    const form = useForm({
        defaultValues: { email: signUpEmail ?? "", password: "" },
        validationLogic: FORM_VALIDATION_LOGIC,
        validators: { onDynamic: signInSchema },
        onSubmitInvalid: ({ formApi }) => focusFirstInvalidField(FIELD_NAMES, formApi),
        onSubmit: async ({ value }) => {
            setErrorMessage(null);

            if (captcha.isWaitingForToken() === true) {
                setErrorMessage(CAPTCHA_PENDING_MESSAGE);
                return;
            }

            const fetchOptions = { headers: buildCaptchaHeaders(captcha.readToken()) };
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

            if (isAuthorizingApp === true) {
                return;
            }

            await router.navigate({ href: redirectTarget });
        },
    });

    let title = SIGN_IN_TITLE;

    if (isAuthorizingApp === true) {
        title = CONNECT_CLAUDE_TITLE;
    }

    return (
        <AuthCard
            eyebrow="Entrar"
            title={title}
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
                {notice !== null && <Alert tone="info">{notice}</Alert>}
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
                <Link
                    to="/forgot-password"
                    className="justify-self-start rounded text-sm font-semibold text-primary-ink underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-99"
                >
                    Esqueci minha senha
                </Link>
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
            <p className="text-center text-sm text-foreground/65">
                Não consegue entrar?{" "}
                <Link
                    to="/contact"
                    className="inline-block rounded font-semibold text-primary-ink underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-99"
                >
                    Fale com o suporte
                </Link>
            </p>
        </AuthCard>
    );
}
