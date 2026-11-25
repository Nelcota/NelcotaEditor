/** Better Auth signs every MCP access token with a subject; one without it is a bug, not a user. */
export class MissingTokenSubjectError extends Error {
    constructor() {
        super("An MCP access token arrived without a subject");
        this.name = "MissingTokenSubjectError";
    }
}
