import CheckIcon from "~icons/lucide/check";
import CircleAlertIcon from "~icons/lucide/circle-alert";
import RotateCwIcon from "~icons/lucide/rotate-cw";
import type { ReactNode } from "react";
import { Button } from "#/shared/ui/button";
import { Spinner } from "#/shared/ui/spinner";

type MutationStatus = "idle" | "pending" | "success" | "error";

const STATUS_LINES: Record<Exclude<MutationStatus, "error">, { icon: ReactNode; text: string }> = {
    idle: {
        icon: <CheckIcon className="size-4 text-success" aria-hidden="true" />,
        text: "As mudanças salvam sozinhas",
    },
    pending: { icon: <Spinner />, text: "Salvando…" },
    success: {
        icon: <CheckIcon className="size-4 text-success" aria-hidden="true" />,
        text: "Salvo automaticamente",
    },
};

interface SaveStatusProps {
    status: MutationStatus;
    onRetry: () => void;
}

/** One line under the fields, the same height in every state so nothing jumps. */
export function SaveStatus({ status, onRetry }: SaveStatusProps): ReactNode {
    if (status === "error") {
        return (
            <div role="alert" className="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1">
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                    <CircleAlertIcon className="size-4 shrink-0" aria-hidden="true" />
                    Não foi possível salvar a última mudança.
                </p>
                <Button variant="secondary" size="sm" onClick={onRetry}>
                    <RotateCwIcon aria-hidden="true" />
                    Tentar de novo
                </Button>
            </div>
        );
    }

    const line = STATUS_LINES[status];

    return (
        <p
            role="status"
            className="flex min-h-8 items-center gap-1.5 text-sm text-muted-foreground"
        >
            {line.icon}
            {line.text}
        </p>
    );
}
