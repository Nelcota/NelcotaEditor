import { PgBoss } from "pg-boss";
import { getEnvironment } from "#/shared/server/env.server";
import { logger } from "#/shared/server/logger.server";

/**
 * "web" only sends jobs; "worker" also runs pg-boss's maintenance (expiring jobs, the scheduler).
 * One process doing maintenance is enough, and the web server should not carry its timers.
 */
export type JobQueueRole = "web" | "worker";

let jobQueuePromise: Promise<PgBoss> | null = null;
let jobQueueRole: JobQueueRole = "web";

/** Call before the first getJobQueue(); the worker sets "worker". */
export function setJobQueueRole(role: JobQueueRole): void {
    if (jobQueuePromise !== null) {
        throw new Error(`The job queue already started as "${jobQueueRole}"`);
    }

    jobQueueRole = role;
}

async function startJobQueue(): Promise<PgBoss> {
    const environment = getEnvironment();
    const isWorker = jobQueueRole === "worker";
    const jobQueue = new PgBoss({
        connectionString: environment.DATABASE_URL,
        supervise: isWorker,
        schedule: isWorker,
    });

    jobQueue.on("error", (error: unknown) => {
        logger.error("Job queue error", { error });
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
