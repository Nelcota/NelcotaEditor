import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuthEntryLayout } from "#/modules/auth/ui/components/auth-entry-layout";
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
        <AuthEntryLayout
            title="Falta só confirmar seu email"
            accountLink={{ text: "Já confirmou?", label: "Entrar", to: "/sign-in" }}
        >
            <div className="grid gap-4">
                <p className="text-center text-muted-foreground [overflow-wrap:anywhere]">
                    Enviamos um link para {email}. Abra para ativar sua conta.
                </p>
                <Alert tone="info">
                    Não chegou? Confira o spam. O link vale por 1 hora; entrar com seu email e senha
                    envia outro.
                </Alert>
                <div className="flex flex-wrap justify-center gap-2">
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
        </AuthEntryLayout>
    );
}
