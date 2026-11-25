import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { sessionNoteInputSchema, toFormatName } from "#/modules/viral-formats/model/edit-session";
import type { EditSessionView } from "#/modules/viral-formats/model/edit-session";
import { invalidateEditSessionQueries } from "#/modules/viral-formats/model/edit-session-queries";
import { addNoteToMyEditSession } from "#/modules/viral-formats/server/edit-session-functions";
import { ReplyForm } from "#/shared/ui/reply-form";

const NOTE_BODY_SCHEMA = sessionNoteInputSchema.shape.body;

function NoteForm({ sessionId }: { sessionId: string }): ReactNode {
    const queryClient = useQueryClient();

    return (
        <ReplyForm
            messageSchema={NOTE_BODY_SCHEMA}
            label="Ajuste para todos os vídeos"
            submitLabel="Enviar ajuste"
            onSend={async (body) => {
                await addNoteToMyEditSession({ data: { sessionId, body } });
                await invalidateEditSessionQueries(queryClient);
            }}
        />
    );
}

/**
 * The batch's adjustments: what the person wants the same in every video, kept in order and
 * handed to their Claude with the videos. Closed once the batch is sent.
 */
export function SessionAdjustments({ session }: { session: EditSessionView }): ReactNode {
    return (
        <section aria-labelledby="session-adjustments" className="grid content-start gap-4">
            <div className="grid gap-1">
                <h2 id="session-adjustments" className="font-bold">
                    Ajustes
                </h2>
                <p className="text-sm text-muted-foreground">
                    Quer algo igual em todos os vídeos? Escreva antes de começar.
                </p>
            </div>
            <ol className="grid gap-3">
                <li className="max-w-xs rounded-2xl bg-secondary p-3 text-sm">
                    Formato <strong>{toFormatName(session.format)}</strong> escolhido. Suba um ou
                    vários vídeos brutos. Quando terminar de adicionar, clique em{" "}
                    <strong>Começar a editar</strong> e o seu Claude edita todos nesse formato.
                </li>
                {session.notes.map((note) => (
                    <li
                        key={note.id}
                        className="max-w-xs justify-self-end rounded-2xl bg-primary-solid p-3 text-sm text-primary-foreground [overflow-wrap:anywhere]"
                    >
                        {note.body}
                    </li>
                ))}
            </ol>
            {session.status === "collecting" && <NoteForm sessionId={session.id} />}
            {session.status === "queued" && (
                <p className="text-sm text-muted-foreground">
                    Os ajustes foram com a edição para o seu Claude.
                </p>
            )}
        </section>
    );
}
