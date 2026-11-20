import { PgBoss } from "pg-boss";
import { getEnvironment } from "#/shared/server/env.server";

let jobQueuePromise: Promise<PgBoss> | null = null;

async function startJobQueue(): Promise<PgBoss> {
    const environment = getEnvironment();
    const jobQueue = new PgBoss({ connectionString: environment.DATABASE_URL });

    jobQueue.on("error", (error: unknown) => {
        console.error("Job queue error", error);
    });
    await jobQueue.start();
    return jobQueue;
}

/** A failed start is not cached, so the next call retries (e.g. the database was still booting). */
async function startJobQueueAllowingRetry(): Promise<PgBoss> {
    try {
        return await startJobQueue();
    } catch (error) {
        jobQueuePromise = null;
        throw error;
    }
}

/** One pg-boss instance per process, started on first use. */
export function getJobQueue(): Promise<PgBoss> {
    if (jobQueuePromise === null) {
        jobQueuePromise = startJobQueueAllowingRetry();
    }

    return jobQueuePromise;
}
