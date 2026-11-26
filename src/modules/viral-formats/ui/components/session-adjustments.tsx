import type { ReactNode } from "react";
import type { SessionNote } from "#/modules/viral-formats/model/edit-session";

export function SessionAdjustments({ notes }: { notes: ReadonlyArray<SessionNote> }): ReactNode {
    if (notes.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="session-adjustments"
            className="grid gap-2 border-t border-border pt-4"
        >
            <h3 id="session-adjustments" className="text-sm font-semibold">
                Ajustes salvos
            </h3>
            <ul className="grid gap-2 text-sm text-muted-foreground">
                {notes.map((note) => (
                    <li key={note.id} className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                        {note.body}
                    </li>
                ))}
            </ul>
        </section>
    );
}
