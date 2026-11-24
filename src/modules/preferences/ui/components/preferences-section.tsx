import RotateCwIcon from "~icons/lucide/rotate-cw";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { PreferencesForm } from "#/modules/preferences/ui/components/preferences-form";
import { preferencesQueryOptions } from "#/modules/preferences/ui/hooks/preferences-queries";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { Skeleton } from "#/shared/ui/skeleton";

export function PreferencesSection(): ReactNode {
    const preferencesQuery = useQuery(preferencesQueryOptions());
    const preferences = preferencesQuery.data;

    if (preferencesQuery.isError === true && preferences === undefined) {
        return (
            <div className="grid justify-items-start gap-3 p-4 sm:p-5">
                <FormAlert message="Não foi possível carregar suas preferências." />
                <Button
                    variant="secondary"
                    onClick={async () => {
                        await preferencesQuery.refetch();
                    }}
                >
                    <RotateCwIcon aria-hidden="true" />
                    Tentar de novo
                </Button>
            </div>
        );
    }

    if (preferences === undefined) {
        return (
            <div className="p-4 sm:p-5">
                <Skeleton className="h-40 rounded-xl" aria-busy="true" aria-label="Carregando" />
            </div>
        );
    }

    return <PreferencesForm initial={preferences} />;
}
