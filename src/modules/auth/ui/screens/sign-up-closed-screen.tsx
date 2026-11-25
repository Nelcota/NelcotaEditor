import type { ReactNode } from "react";
import { AuthEntryLayout } from "#/modules/auth/ui/components/auth-entry-layout";
import { SIGN_UP_CLOSED_MESSAGE } from "#/modules/auth/model/auth-error-message";

/** Shown instead of the form while an admin keeps sign-up closed; signing in still works. */
export function SignUpClosedScreen(): ReactNode {
    return (
        <AuthEntryLayout
            title="Cadastros fechados"
            accountLink={{ text: "Já tem conta?", label: "Entrar", to: "/sign-in" }}
        >
            <p className="text-center text-muted-foreground">
                {SIGN_UP_CLOSED_MESSAGE} Volte mais tarde.
            </p>
        </AuthEntryLayout>
    );
}
