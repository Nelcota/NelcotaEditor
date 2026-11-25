import type { ReactNode } from "react";
import { AuthCard } from "#/modules/auth/ui/components/auth-card";

/**
 * After sign-up while the email-verification switch is off. A taken email lands here too, so the
 * copy never claims a new account was made for this person.
 */
export function AccountCreatedCard(): ReactNode {
    return (
        <AuthCard
            eyebrow="Criar conta"
            title={{ lead: "Tudo", emphasis: "pronto" }}
            description="Entre com seu email e senha para começar."
            footer={{ text: "Próximo passo:", linkLabel: "Entrar", linkTo: "/sign-in" }}
        />
    );
}
