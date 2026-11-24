/** The latest edits did not reach the server, so the render was not sent. */
export class DraftNotSavedError extends Error {
    constructor() {
        super(
            "Não foi possível salvar as últimas mudanças, então o corte não foi enviado. Tente novamente.",
        );
        this.name = "DraftNotSavedError";
    }
}
