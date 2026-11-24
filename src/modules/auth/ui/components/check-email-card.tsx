import type { ReactNode } from "react";
import { AuthCard } from "#/modules/auth/ui/components/auth-card";
import { Alert } from "#/shared/ui/alert";

interface CheckEmailCardProps {
    email: string;
}

/** After sign-up: the account opens only from the link sent to the address. */
export function CheckEmailCard({ email }: CheckEmailCardProps): ReactNode {
    return (
        <AuthCard
            eyebrow="Confirme seu email"
            title={{ lead: "Falta só", emphasis: "confirmar seu email" }}
            description={`Enviamos um link para ${email}. Abra para ativar sua conta.`}
            footer={{ text: "Já confirmou?", linkLabel: "Entrar", linkTo: "/sign-in" }}
        >
            <Alert tone="info">
                Não chegou? Confira o spam. O link vale por 1 hora; depois, entre com seu email e
                senha para receber outro.
            </Alert>
        </AuthCard>
    );
}
