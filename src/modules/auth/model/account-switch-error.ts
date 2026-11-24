/** Better Auth refused to switch accounts; the message is already written for the person. */
export class AccountSwitchError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AccountSwitchError";
    }
}
