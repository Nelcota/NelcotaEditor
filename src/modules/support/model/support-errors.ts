import { MAX_OPEN_TICKETS_PER_PERSON } from "#/modules/support/model/support-ticket";
import { UserFacingError } from "#/shared/server/user-facing-error";

export class TooManyOpenTicketsError extends UserFacingError {
    constructor() {
        super(
            `Você já tem ${MAX_OPEN_TICKETS_PER_PERSON} tickets ativos. Feche um antes de abrir ou reabrir outro.`,
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
