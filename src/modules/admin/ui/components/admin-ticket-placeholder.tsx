import type { ReactNode } from "react";

/** Beside the queue on wide screens, until a ticket is picked; phones show the queue alone. */
export function AdminTicketPlaceholder(): ReactNode {
    return (
        <p className="hidden text-sm text-muted-foreground lg:block">
            Escolha um ticket na fila para ler e responder.
        </p>
    );
}
