import PlayIcon from "~icons/lucide/play";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { EditSessionView } from "#/modules/viral-formats/model/edit-session";
import { invalidateEditSessionQueries } from "#/modules/viral-formats/model/edit-session-queries";
import { queueMyEditSession } from "#/modules/viral-formats/server/edit-session-functions";
import { Button } from "#/shared/ui/button";
import { CopyTextButton } from "#/shared/ui/copy-text-button";
import { FormAlert } from "#/shared/ui/form-alert";
import { pluralize } from "#/shared/ui/pluralize";
import { toErrorMessage } from "#/shared/ui/to-error-message";

const CLAUDE_REQUEST = "Edite a minha fila do Editor Oculto.";
const FALLBACK_ERROR_MESSAGE = "Não foi possível mandar para o Claude. Tente de novo.";
const UPLOADS_RUNNING_MESSAGE = "Espere os envios terminarem para começar a editar.";

interface SessionActionsProps {
    session: EditSessionView;
    uploadsRunning: number;
}

function describeQueue(videoCount: number): string {
    if (videoCount === 0) {
        return "Nenhum vídeo enviado ainda";
    }

    return `${videoCount} ${pluralize(videoCount, "vídeo", "vídeos")} na fila`;
}

/** After the batch is sent: what to tell Claude, ready to copy. */
function QueuedForClaude(): ReactNode {
    return (
        <div className="grid gap-3 rounded-2xl border border-card-border p-4 sm:p-5">
            <p className="font-bold">Na fila do Claude</p>
            <p className="text-sm text-muted-foreground">
                Abra o seu Claude e peça a edição. Os vídeos prontos aparecem aqui e em Minhas
                edições.
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-56 flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm">
                    {CLAUDE_REQUEST}
                </code>
                <CopyTextButton text={CLAUDE_REQUEST} label="Copiar pedido" />
            </div>
            <p className="text-sm text-muted-foreground">
                O Claude ainda não está conectado?{" "}
                <Link
                    to="/claude"
                    className="font-semibold text-primary-ink underline underline-offset-4"
                >
                    Etapa 1
                </Link>
            </p>
        </div>
    );
}

/** The bottom of a batch: how many videos it holds and, while open, sending it to Claude. */
export function SessionActions({ session, uploadsRunning }: SessionActionsProps): ReactNode {
    const queryClient = useQueryClient();
    const videoCount = session.videos.length;
    const start = useMutation({
        mutationFn: async () => {
            if (uploadsRunning > 0) {
                throw new Error(UPLOADS_RUNNING_MESSAGE);
            }

            await queueMyEditSession({ data: { sessionId: session.id } });
        },
        onSuccess: () => invalidateEditSessionQueries(queryClient),
    });

    if (session.status === "queued") {
        return <QueuedForClaude />;
    }

    return (
        <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground tabular-nums">
                    {describeQueue(videoCount)}
                </p>
                <Button
                    type="button"
                    size="lg"
                    className="font-bold"
                    disabled={start.isPending}
                    aria-busy={start.isPending}
                    onClick={() => start.mutate()}
                >
                    <PlayIcon aria-hidden="true" className="size-4 fill-current" />
                    Começar a editar
                    {videoCount > 0 && ` ${videoCount} ${pluralize(videoCount, "vídeo", "vídeos")}`}
                </Button>
            </div>
            {start.isError === true && (
                <FormAlert message={toErrorMessage(start.error, FALLBACK_ERROR_MESSAGE)} />
            )}
        </div>
    );
}
