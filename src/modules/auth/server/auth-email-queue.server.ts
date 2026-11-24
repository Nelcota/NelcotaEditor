import {
    authEmailJobSchema,
    buildAuthEmail,
} from "#/modules/auth/server/auth-email-content.server";
import type { AuthEmailJob } from "#/modules/auth/server/auth-email-content.server";
import { sendEmail } from "#/shared/server/email/send-email.server";
import { getJobQueue } from "#/shared/server/job-queue.server";
import { logger } from "#/shared/server/logger.server";

export const AUTH_EMAIL_QUEUE = "send-auth-email";

const ONE_HOUR_IN_SECONDS = 60 * 60;
const RETRY_LIMIT = 5;
const FIRST_RETRY_DELAY_SECONDS = 10;

let queueReadyPromise: Promise<void> | null = null;

async function createAuthEmailQueue(): Promise<void> {
    const jobQueue = await getJobQueue();
    // Links expire in an hour, so a job still unsent by then is dropped instead of retried, and a
    // sent one (it holds the link) is deleted an hour later.
    await jobQueue.createQueue(AUTH_EMAIL_QUEUE, {
        retryLimit: RETRY_LIMIT,
        retryDelay: FIRST_RETRY_DELAY_SECONDS,
        retryBackoff: true,
        retentionSeconds: ONE_HOUR_IN_SECONDS,
        deleteAfterSeconds: ONE_HOUR_IN_SECONDS,
    });
}

/** A failed attempt is forgotten, so a database hiccup does not break every later enqueue. */
async function createAuthEmailQueueOrReset(): Promise<void> {
    try {
        await createAuthEmailQueue();
    } catch (error) {
        queueReadyPromise = null;
        throw error;
    }
}

function ensureAuthEmailQueue(): Promise<void> {
    if (queueReadyPromise === null) {
        queueReadyPromise = createAuthEmailQueueOrReset();
    }

    return queueReadyPromise;
}

/**
 * Better Auth calls this inside sign-up and password reset. Queuing takes the same time whether
 * or not the email exists, so response times do not reveal registered addresses.
 */
export async function enqueueAuthEmail(job: AuthEmailJob): Promise<void> {
    await ensureAuthEmailQueue();
    const jobQueue = await getJobQueue();
    await jobQueue.send(AUTH_EMAIL_QUEUE, job);
}

interface QueuedAuthEmail {
    id: string;
    data: unknown;
}

class InvalidAuthEmailJobError extends Error {
    constructor(jobId: string) {
        super(`Job ${jobId} of queue ${AUTH_EMAIL_QUEUE} has an invalid payload`);
        this.name = "InvalidAuthEmailJobError";
    }
}

/** Ids and kind only: the address and the link are personal data and a secret. */
async function sendQueuedAuthEmail(job: QueuedAuthEmail): Promise<void> {
    const result = authEmailJobSchema.safeParse(job.data);

    if (result.success === false) {
        logger.error({ jobId: job.id }, "Rejecting an auth email job with an invalid payload");
        throw new InvalidAuthEmailJobError(job.id);
    }

    const authEmail = result.data;
    const content = buildAuthEmail(authEmail);

    try {
        await sendEmail({ ...content, to: authEmail.to, idempotencyKey: `auth-email/${job.id}` });
    } catch (error) {
        // pg-boss retries with backoff; this line is the one record of why.
        logger.error({ jobId: job.id, kind: authEmail.kind, error }, "Auth email not sent");
        throw error;
    }

    logger.info({ jobId: job.id, kind: authEmail.kind }, "Auth email sent");
}

/** Runs in the worker, the one process holding the Resend key. */
export async function startAuthEmailWorker(): Promise<void> {
    await ensureAuthEmailQueue();
    const jobQueue = await getJobQueue();

    await jobQueue.work(AUTH_EMAIL_QUEUE, async (jobs) => {
        for (const job of jobs) {
            await sendQueuedAuthEmail(job);
        }
    });
}
