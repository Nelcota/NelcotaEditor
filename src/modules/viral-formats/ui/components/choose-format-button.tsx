import ArrowRightIcon from "~icons/lucide/arrow-right";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { invalidateEditSessionQueries } from "#/modules/viral-formats/model/edit-session-queries";
import type { EditFormat } from "#/modules/viral-formats/model/edit-status";
import { isEditFormat } from "#/modules/viral-formats/model/edit-status";
import type { ViralFormat } from "#/modules/viral-formats/model/viral-formats";
import { createMyEditSession } from "#/modules/viral-formats/server/edit-session-functions";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const FALLBACK_ERROR_MESSAGE = "Não foi possível abrir a edição. Tente de novo.";

interface ChooseFormatButtonProps {
    format: ViralFormat;
    /** Shown beside it, such as the dialog's Voltar. */
    children?: ReactNode;
}

/** Choosing a format opens a new batch for it, where the raw videos go in. */
function OpenSessionButton(props: { format: EditFormat; children?: ReactNode }): ReactNode {
    const { format, children } = props;
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const open = useMutation({
        mutationFn: async () => await createMyEditSession({ data: { format } }),
        onSuccess: async ({ sessionId }) => {
            await invalidateEditSessionQueries(queryClient);
            await navigate({ to: "/edits/$sessionId", params: { sessionId } });
        },
    });

    return (
        <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    size="lg"
                    className="font-bold"
                    disabled={open.isPending}
                    aria-busy={open.isPending}
                    onClick={() => open.mutate()}
                >
                    Escolher formato
                    <ArrowRightIcon aria-hidden="true" className="size-4" />
                </Button>
                {children}
            </div>
            {open.isError === true && (
                <FormAlert message={toErrorMessage(open.error, FALLBACK_ERROR_MESSAGE)} />
            )}
        </div>
    );
}

/** The way on from a format: a new batch, or word that it is not open yet. */
export function ChooseFormatButton({ format, children }: ChooseFormatButtonProps): ReactNode {
    const formatId = format.id;

    if (isEditFormat(formatId) === true) {
        return <OpenSessionButton format={formatId}>{children}</OpenSessionButton>;
    }

    return (
        <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">
                Este formato chega em breve. Por enquanto, edite na Tela dividida.
            </p>
            <div className="flex flex-wrap gap-2">{children}</div>
        </div>
    );
}
