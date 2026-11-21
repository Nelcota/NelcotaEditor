import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { signInSchema } from "#/modules/auth/auth-forms.schema";
import { authClient } from "#/modules/auth/client/auth-client";
import { runAuthRequest } from "#/modules/auth/client/run-auth-request";
import { AuthCard } from "#/modules/auth/ui/auth-card";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessages } from "#/shared/ui/form-errors";
import { TextField } from "#/shared/ui/text-field";

export function SignInScreen(): ReactNode {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const form = useForm({
        defaultValues: { email: "", password: "" },
        validators: { onSubmit: signInSchema },
        onSubmit: async ({ value }) => {
            setErrorMessage(null);
            const failure = await runAuthRequest(() => authClient.signIn.email(value));

            if (failure !== null) {
                setErrorMessage(failure);
                return;
            }

            // A session that expired in this tab may have left another account's videos cached.
            queryClient.clear();
            await router.navigate({ to: "/" });
        },
    });

    return (
        <AuthCard
            title="Entrar"
            description="Acesse seus vídeos e cortes."
            footer={{ text: "Ainda não tem conta?", linkLabel: "Criar conta", linkTo: "/sign-up" }}
        >
            <form
                noValidate
                className="grid gap-4"
                onSubmit={async (event) => {
                    event.preventDefault();
                    await form.handleSubmit();
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
                        </Button>
                    )}
                </form.Subscribe>
            </form>
        </AuthCard>
    );
}
