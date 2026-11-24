import RotateCwIcon from "~icons/lucide/rotate-cw";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "#/shared/ui/button";
import { StandaloneMessageScreen } from "#/shared/ui/standalone-message-screen";
import { reportClientProblem } from "#/shared/errors/report-client-problem";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

/** Last resort for errors no screen handled; the details go to the error handlers, not to the page. */
export function RouteErrorScreen({ error, reset }: ErrorComponentProps) {
    const track = useTrackPromise();
    const router = useRouter();

    useEffect(() => {
        reportClientProblem("Unhandled route error", error);
    }, [error]);

    const retry = async (): Promise<void> => {
        reset();

        // A click handler has no caller to hand the failure to; the screen stays up to retry again.
        try {
            await router.invalidate();
        } catch (invalidateError) {
            reportClientProblem("Could not reload the route", invalidateError);
        }
    };

    return (
        <StandaloneMessageScreen
            title="Algo deu errado"
            description="Não foi possível mostrar esta página. Tente de novo; se continuar, volte ao início."
            actions={
                <Button onClick={() => track(retry())}>
                    <RotateCwIcon aria-hidden="true" />
                    Tentar de novo
                </Button>
            }
        />
    );
}
