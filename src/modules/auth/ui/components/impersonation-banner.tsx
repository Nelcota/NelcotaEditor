import SpeechIcon from "~icons/lucide/speech";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { currentUserQueryOptions } from "#/modules/auth/model/current-user-query";
import { stopImpersonation } from "#/modules/auth/client/account-switch";
import { Button } from "#/shared/ui/button";

/** While an admin is signed in as someone else, every page says so and offers the way back. */
export function ImpersonationBanner(): ReactNode {
    const currentUserQuery = useQuery(currentUserQueryOptions());
    const currentUser = currentUserQuery.data;
    const stop = useMutation({ mutationFn: stopImpersonation, networkMode: "always" });
    // On success the page is already leaving; a second click would start another switch.
    const isSwitching = stop.isPending || stop.isSuccess;

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
                Você está vendo o Editor Oculto como <strong>{currentUser.name}</strong> (
                {currentUser.email}). O que fizer aqui vale para a conta dessa pessoa.
                {stop.isError === true && (
                    <span role="alert" className="block text-destructive">
                        {stop.error.message}
                    </span>
                )}
            </p>
            <Button
                size="sm"
                variant="secondary"
                disabled={isSwitching}
                aria-busy={isSwitching}
                onClick={() => stop.mutate()}
            >
                Voltar para minha conta
            </Button>
        </div>
    );
}
