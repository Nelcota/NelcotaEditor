import {
    buildSupportEmail,
    supportEmailJobSchema,
} from "#/modules/support/server/support-email-content.server";
import type { SupportEmailJob } from "#/modules/support/server/support-email-content.server";
import { sendEmail } from "#/shared/server/email/send-email.server";
import { getJobQueue } from "#/shared/server/job-queue.server";
import { logger } from "#/shared/server/logger.server";

export const SUPPORT_EMAIL_QUEUE = "send-support-email";

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;
const RETRY_LIMIT = 5;
const FIRST_RETRY_DELAY_SECONDS = 10;

let queueReadyPromise: Promise<void> | null = null;

// A guest job holds the answer's text, so a sent job is deleted after a day.
async function createSupportEmailQueue(): Promise<void> {
    const jobQueue = await getJobQueue();
    await jobQueue.createQueue(SUPPORT_EMAIL_QUEUE, {
        retryLimit: RETRY_LIMIT,
        retryDelay: FIRST_RETRY_DELAY_SECONDS,
        retryBackoff: true,
        retentionSeconds: ONE_DAY_IN_SECONDS,
        deleteAfterSeconds: ONE_DAY_IN_SECONDS,
    });
}

/** A failed attempt is forgotten, so a database hiccup does not break every later enqueue. */
async function createSupportEmailQueueOrReset(): Promise<void> {
    try {
        await createSupportEmailQueue();
    } catch (error) {
        queueReadyPromise = null;
        throw error;
    }
}

export function ensureSupportEmailQueue(): Promise<void> {
    if (queueReadyPromise === null) {
        queueReadyPromise = createSupportEmailQueueOrReset();
    }

    return queueReadyPromise;
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function enqueueSupportEmail(
    job: SupportEmailJob,
    transaction: Transaction,
): Promise<void> {
    const jobQueue = await getJobQueue();
    const jobId = await jobQueue.send(SUPPORT_EMAIL_QUEUE, job, {
        db: fromDrizzle(transaction, sql),
    });

    if (jobId === null) {
        throw new Error("Enqueuing a support email returned no job");
    }
}

interface QueuedSupportEmail {
    id: string;
    data: unknown;
}

class InvalidSupportEmailJobError extends Error {
    constructor(jobId: string) {
        super(`Job ${jobId} of queue ${SUPPORT_EMAIL_QUEUE} has an invalid payload`);
        this.name = "InvalidSupportEmailJobError";
    }
}

/** Ids and the ticket number only: the address and the answer are personal data. */
async function sendQueuedSupportEmail(job: QueuedSupportEmail): Promise<void> {
    const result = supportEmailJobSchema.safeParse(job.data);

    if (result.success === false) {
        logger.error({ jobId: job.id }, "Rejecting a support email job with an invalid payload");
        throw new InvalidSupportEmailJobError(job.id);
    }

    const supportEmail = result.data;
    const ticketNumber = supportEmail.ticketNumber;
    const content = buildSupportEmail(supportEmail);

    try {
        await sendEmail({ ...content, to: supportEmail.to, idempotencyKey: `support/${job.id}` });
    } catch (error) {
        // pg-boss retries with backoff; this line is the one record of why.
        logger.error({ jobId: job.id, ticketNumber, error }, "Support email not sent");
        throw error;
    }

    logger.info({ jobId: job.id, ticketNumber }, "Support email sent");
}

/** Runs in the worker, the one process holding the Resend key. */
export async function startSupportEmailWorker(): Promise<void> {
    await ensureSupportEmailQueue();
    const jobQueue = await getJobQueue();

    await jobQueue.work(SUPPORT_EMAIL_QUEUE, async (jobs) => {
        for (const job of jobs) {
            await sendQueuedSupportEmail(job);
        }
    });
}
import { sql } from "drizzle-orm";
import { fromDrizzle } from "pg-boss";
import type { db } from "#/db/database.server";
