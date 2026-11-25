import ArrowRightIcon from "~icons/lucide/arrow-right";
import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Button } from "#/shared/ui/button";

const COPIED_MESSAGE = "Pedido copiado. Cole no seu Claude e diga qual vídeo editar.";
const FAILED_MESSAGE = "Não deu para copiar. Peça ao seu Claude:";

interface ChooseFormatButtonProps {
    formatName: string;
    /** Shown beside it, such as the dialog's Voltar. */
    children?: ReactNode;
}

function toClaudeRequest(formatName: string): string {
    return `Use o Editor Oculto para editar meu vídeo no formato ${formatName}.`;
}

/**
 * Choosing a format means asking the person's Claude, which does the editing: the button copies
 * a ready request to paste there, and says so.
 */
export function ChooseFormatButton({ formatName, children }: ChooseFormatButtonProps): ReactNode {
    const request = toClaudeRequest(formatName);
    const copy = useMutation({
        mutationFn: async () => await navigator.clipboard.writeText(request),
    });

    return (
        <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    size="lg"
                    className="font-bold"
                    disabled={copy.isPending}
                    aria-busy={copy.isPending}
                    onClick={() => copy.mutate()}
                >
                    Escolher formato
                    <ArrowRightIcon aria-hidden="true" className="size-4" />
                </Button>
                {children}
            </div>
            <p role="status" className="text-sm text-muted-foreground empty:hidden">
                {copy.isSuccess === true && COPIED_MESSAGE}
                {copy.isError === true && `${FAILED_MESSAGE} "${request}"`}
            </p>
        </div>
    );
}
