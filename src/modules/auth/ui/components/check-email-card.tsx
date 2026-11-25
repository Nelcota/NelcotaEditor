import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuthCard } from "#/modules/auth/ui/components/auth-card";
import { Alert } from "#/shared/ui/alert";
import { Button } from "#/shared/ui/button";

interface CheckEmailCardProps {
    email: string;
    /** Back to the filled-in form, to fix a mistyped address. */
    onChangeEmail: () => void;
}

/**
 * After sign-up: the account opens only from the link sent to the address. Signing in with an
 * unconfirmed address sends a new link, so that is the way to get another one.
 */
export function CheckEmailCard({ email, onChangeEmail }: CheckEmailCardProps): ReactNode {
    return (
        <AuthCard
            eyebrow="Confirme seu email"
            title={{ lead: "Falta só", emphasis: "confirmar seu email" }}
            description={`Enviamos um link para ${email}. Abra para ativar sua conta.`}
            footer={{ text: "Já confirmou?", linkLabel: "Entrar", linkTo: "/sign-in" }}
        >
            <div className="grid gap-4">
                <Alert tone="info">
                    Não chegou? Confira o spam. O link vale por 1 hora; entrar com seu email e senha
                    envia outro.
                </Alert>
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="secondary">
                        <Link to="/sign-in" state={{ signInEmail: email }}>
                            Entrar para receber outro link
                        </Link>
                    </Button>
                    <Button type="button" variant="ghost" onClick={onChangeEmail}>
                        Corrigir o email
                    </Button>
                </div>
            </div>
        </AuthCard>
    );
}
