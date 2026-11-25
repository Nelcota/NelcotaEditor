import { MAX_OPEN_TICKETS_PER_PERSON } from "#/modules/support/model/support-ticket";
import { UserFacingError } from "#/shared/server/user-facing-error";

export class TooManyOpenTicketsError extends UserFacingError {
    constructor() {
        super(
            `Você já tem ${MAX_OPEN_TICKETS_PER_PERSON} conversas abertas. Marque uma como resolvida antes de abrir ou reabrir outra.`,
        );
        this.name = "TooManyOpenTicketsError";
    }
}

export class TicketVideoNotFoundError extends UserFacingError {
    constructor() {
        super("Este vídeo não foi encontrado. Escolha outro ou deixe o campo vazio.");
        this.name = "TicketVideoNotFoundError";
    }
}
