import RestartIcon from "~icons/solar/restart-linear";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "#/shared/ui/button";
import { StandaloneMessageScreen } from "#/shared/ui/standalone-message-screen";

/** Last resort for errors no screen handled; the details go to the console, not to the page. */
export function RouteErrorScreen({ error, reset }: ErrorComponentProps) {
    const router = useRouter();

    useEffect(() => {
        console.error("Unhandled route error", error);
    }, [error]);

    const retry = async (): Promise<void> => {
        reset();

        // A click handler has no caller to hand the failure to; the screen stays up to retry again.
        try {
            await router.invalidate();
        } catch (invalidateError) {
            console.error("Could not reload the route", invalidateError);
        }
    };

    return (
        <StandaloneMessageScreen
            title="Algo deu errado"
            description="Não foi possível mostrar esta página. Tente de novo; se continuar, volte ao início."
            actions={
                <Button className="rounded-full" onClick={retry}>
                    <RestartIcon aria-hidden="true" />
                    Tentar de novo
                </Button>
            }
        />
    );
}
