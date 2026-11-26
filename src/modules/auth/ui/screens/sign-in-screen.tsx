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
import { AuthEntryLayout } from "#/modules/auth/ui/components/auth-entry-layout";
import { buildCaptchaHeaders } from "#/modules/auth/client/captcha-headers";
import { CaptchaField } from "#/shared/ui/captcha-field";
import { CAPTCHA_PENDING_MESSAGE, useCaptcha } from "#/shared/ui/use-captcha";
import { Alert } from "#/shared/ui/alert";
import { Button, textLinkClass } from "#/shared/ui/button";
import { cn } from "#/shared/ui/cn";
import { FormAlert } from "#/shared/ui/form-alert";
import { focusFirstInvalidField } from "#/shared/ui/focus-first-invalid-field";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { TextField } from "#/shared/ui/text-field";
import { useTrackPromise } from "#/shared/ui/use-track-promise";
import { FORM_VALIDATION_LOGIC } from "#/shared/ui/form-validation-logic";

const SIGN_IN_TITLE = "Entrar na sua conta";
const CONNECT_CLAUDE_TITLE = "Entre para conectar o Claude";

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

function useSignInForm({
    captchaSiteKey,
    redirectTarget,
    isAuthorizingApp,
}: Pick<SignInScreenProps, "captchaSiteKey" | "redirectTarget" | "isAuthorizingApp">) {
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

    return { form, captcha, errorMessage };
}

export function SignInScreen({
    captchaSiteKey,
    search,
    redirectTarget,
    isAuthorizingApp = false,
}: SignInScreenProps): ReactNode {
    const { form, captcha, errorMessage } = useSignInForm({
        captchaSiteKey,
        redirectTarget,
        isAuthorizingApp,
    });
    const notice = toSignInNotice(search);
    let title = SIGN_IN_TITLE;

    if (isAuthorizingApp === true) {
        title = CONNECT_CLAUDE_TITLE;
    }
    const track = useTrackPromise();

    return (
        <AuthEntryLayout
            title={title}
            accountLink={{ text: "Ainda não tem conta?", label: "Criar conta", to: "/sign-up" }}
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
                {notice !== null && <Alert tone="info">{notice}</Alert>}
                <form.Field name="email">
                    {(field) => (
                        <TextField
                            id="email"
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
                <div className="grid gap-2">
                    <form.Field name="password">
                        {(field) => (
                            <TextField
                                id="password"
                                name="password"
                                label="Senha"
                                type="password"
                                autoComplete="current-password"
                                required
                                enterKeyHint="go"
                                className="h-12"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onValueChange={field.handleChange}
                                errors={toErrorMessages(field.state.meta.errors)}
                            />
                        )}
                    </form.Field>
                    <Link
                        to="/forgot-password"
                        className={cn(textLinkClass, "justify-self-end text-sm")}
                    >
                        Esqueci minha senha
                    </Link>
                </div>
                <CaptchaField captcha={captcha} />
                <FormAlert message={errorMessage} />
                <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                        <Button
                            type="submit"
                            size="lg"
                            className="h-12 font-semibold"
                            isLoading={isSubmitting}
                            loadingLabel="Entrando…"
                        >
                            Entrar
                            <ArrowRightIcon aria-hidden="true" className="size-4" />
                        </Button>
                    )}
                </form.Subscribe>
            </form>
        </AuthEntryLayout>
    );
}
