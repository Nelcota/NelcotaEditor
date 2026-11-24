import SpeechIcon from "~icons/lucide/speech";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { currentUserQueryOptions } from "#/modules/auth/ui/hooks/current-user-query";
import { useStopImpersonation } from "#/modules/auth/ui/hooks/use-impersonation";
import { Button } from "#/shared/ui/button";

/** While an admin is signed in as someone else, every page says so and offers the way back. */
export function ImpersonationBanner(): ReactNode {
    const currentUserQuery = useQuery(currentUserQueryOptions());
    const currentUser = currentUserQuery.data;
    const stop = useStopImpersonation();

    if (currentUser === null || currentUser === undefined || currentUser.isImpersonated === false) {
        return null;
    }

    return (
        <div
            role="status"
            className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm"
        >
            <SpeechIcon className="size-5 shrink-0 text-primary-ink" aria-hidden="true" />
            <p className="min-w-0 flex-[1_1_16rem]">
                Você está vendo o Nelcota como <strong>{currentUser.name}</strong> (
                {currentUser.email}). O que fizer aqui vale para a conta dessa pessoa.
                {stop.errorMessage !== null && (
                    <span role="alert" className="block text-destructive">
                        {stop.errorMessage}
                    </span>
                )}
            </p>
            <Button
                size="sm"
                variant="secondary"
                disabled={stop.isRunning}
                aria-busy={stop.isRunning}
                onClick={stop.run}
            >
                Voltar para minha conta
            </Button>
        </div>
    );
}
