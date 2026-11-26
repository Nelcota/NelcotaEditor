import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuthEntryLayout } from "#/modules/auth/ui/components/auth-entry-layout";
import { Button } from "#/shared/ui/button";

/**
 * After sign-up while the email-verification switch is off. A taken email lands here too, so the
 * copy never claims a new account was made for this person.
 */
export function AccountCreatedCard(): ReactNode {
    return (
        <AuthEntryLayout title="Tudo pronto">
            <p className="text-center text-muted-foreground">
                Entre com seu email e senha para começar.
            </p>
            <Button asChild size="lg" className="h-12 font-semibold">
                <Link to="/sign-in">Entrar</Link>
            </Button>
        </AuthEntryLayout>
    );
}
