import type { ReactNode } from "react";
import { AuthCard } from "#/modules/auth/ui/components/auth-card";
import { SIGN_UP_CLOSED_MESSAGE } from "#/modules/auth/model/auth-error-message";

/** Shown instead of the form while an admin keeps sign-up closed; signing in still works. */
export function SignUpClosedScreen(): ReactNode {
    return (
        <AuthCard
            eyebrow="Criar conta"
            title={{ lead: "Cadastros", emphasis: "fechados" }}
            description={`${SIGN_UP_CLOSED_MESSAGE} Volte mais tarde.`}
            footer={{ text: "Já tem conta?", linkLabel: "Entrar", linkTo: "/sign-in" }}
        />
    );
}
