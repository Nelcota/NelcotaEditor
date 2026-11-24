export class NoSourceError extends Error {
    constructor() {
        super("Cole um link do YouTube ou escolha um arquivo.");
        this.name = "NoSourceError";
    }
}
