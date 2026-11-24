import { getEnvironment } from "#/shared/server/env.server";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const SEND_TIMEOUT_MILLISECONDS = 10_000;
// Resend rejects requests without a User-Agent.
const USER_AGENT = "nelcota-worker";

export interface OutgoingEmail {
    to: string;
    subject: string;
    html: string;
    text: string;
    /** Resend sends once per key for 24 hours, so a retried job never sends a second copy. */
    idempotencyKey: string;
}

export class EmailNotConfiguredError extends Error {
    constructor() {
        super("RESEND_API_KEY is not set, so no email can be sent");
        this.name = "EmailNotConfiguredError";
    }
}

export class EmailRejectedError extends Error {
    readonly status: number;

    constructor(status: number) {
        super(`Resend rejected the email with HTTP ${status}`);
        this.name = "EmailRejectedError";
        this.status = status;
    }
}

export async function sendEmail(email: OutgoingEmail): Promise<void> {
    const environment = getEnvironment();
    const apiKey = environment.RESEND_API_KEY;

    if (apiKey === undefined) {
        throw new EmailNotConfiguredError();
    }

    if (email.to.trim().length === 0 || email.idempotencyKey.trim().length === 0) {
        throw new RangeError("An email needs a recipient and an idempotency key");
    }

    const response = await fetch(RESEND_EMAILS_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
            "Idempotency-Key": email.idempotencyKey,
        },
        body: JSON.stringify({
            from: environment.EMAIL_FROM,
            to: [email.to],
            subject: email.subject,
            html: email.html,
            text: email.text,
        }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MILLISECONDS),
    });

    if (response.ok === false) {
        throw new EmailRejectedError(response.status);
    }
}
