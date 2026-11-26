import ArrowRightIcon from "~icons/lucide/arrow-right";
import CircleCheckIcon from "~icons/lucide/circle-check";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CLAUDE_CONNECTION_QUERY_KEY } from "#/modules/auth/model/claude-connection-queries";
import { disconnectMyClaude } from "#/modules/auth/server/claude-connection-functions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "#/shared/ui/alert-dialog";
import { Button } from "#/shared/ui/button";
import { FormAlert } from "#/shared/ui/form-alert";
import { formatDateTime } from "#/shared/ui/format";

const DISCONNECT_FAILED_MESSAGE = "Não foi possível desconectar o Claude. Tente de novo.";

function DisconnectClaudeButton(): ReactNode {
    const queryClient = useQueryClient();
    const disconnect = useMutation({
        mutationFn: () => disconnectMyClaude(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAUDE_CONNECTION_QUERY_KEY }),
    });

    return (
        <div className="grid gap-2">
            {disconnect.isError === true && <FormAlert message={DISCONNECT_FAILED_MESSAGE} />}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button type="button" variant="secondary" disabled={disconnect.isPending}>
                        Desconectar
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desconectar o Claude?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O Claude perde o acesso à sua conta na hora. Para usar os Formatos
                            Virais de novo, você conecta outra vez.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => disconnect.mutate()}
                        >
                            Desconectar Claude
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

/** Claude is in: when it connected, the way on to the formats and the way to cut it off. */
export function ClaudeConnectedCard({ connectedAt }: { connectedAt: string }): ReactNode {
    return (
        <div className="grid gap-5">
            <p className="flex items-start gap-3">
                <CircleCheckIcon
                    aria-hidden="true"
                    className="mt-0.5 size-6 shrink-0 text-success"
                />
                <span className="grid gap-0.5">
                    <span className="font-bold">Claude conectado</span>
                    <span className="text-meta text-muted-foreground">
                        Desde {formatDateTime(connectedAt)}
                    </span>
                </span>
            </p>
            <p className="text-muted-foreground">
                No Claude, peça por exemplo: “edite meu último vídeo no formato Tela dividida”.
            </p>
            <div className="flex flex-wrap gap-2">
                <Button asChild className="font-bold">
                    <Link to="/formats">
                        Ver os formatos
                        <ArrowRightIcon aria-hidden="true" className="size-4" />
                    </Link>
                </Button>
                <DisconnectClaudeButton />
            </div>
        </div>
    );
}
