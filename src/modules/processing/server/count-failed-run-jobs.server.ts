import { sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { PROCESS_VIDEO_QUEUE } from "#/modules/processing/server/video-processing-queue.server";
import type { VideoRun } from "#/modules/video-records/server/video-progress.server";

// A run's first job is sent in the transaction that stores its start, and pg-boss stamps the job
// with that transaction's now(), which can come just before the start the app wrote.
const RUN_START_TOLERANCE = sql`interval '1 minute'`;

const countRowSchema = z.object({ failedJobCount: z.coerce.number().int().min(0) });

/** A video from before runs were stamped has no start, so every failed job of it counts. */
function createdInRun(processingStartedAt: Date | null): SQL {
    if (processingStartedAt === null) {
        return sql`true`;
    }

    return sql`created_on > ${processingStartedAt.toISOString()}::timestamptz - ${RUN_START_TOLERANCE}`;
}

/**
 * Jobs of the video's current run that pg-boss failed: the worker died under them (out of memory,
 * a native crash) or could not record how the run ended. A run that fails normally records it on
 * the video and completes its job, so only these count.
 *
 * Only pg-boss's table is queried, with the run's values as parameters: a correlated reference to
 * the videos table inside a subquery would be printed unqualified and bind to the job's own id.
 */
export async function countFailedRunJobs(run: VideoRun): Promise<number> {
    const { videoId, processingStartedAt } = run;

    if (videoId.trim().length === 0) {
        throw new RangeError("Cannot count the failed jobs of a video without an id");
    }

    const result = await db.execute(
        sql`select count(*) as "failedJobCount" from pgboss.job where name = ${PROCESS_VIDEO_QUEUE} and singleton_key = ${videoId} and state = 'failed' and ${createdInRun(processingStartedAt)}`,
    );
    const parsed = countRowSchema.safeParse(result.rows[0]);

    if (parsed.success === false) {
        throw new Error(`Unexpected failed job count for video ${videoId}`, {
            cause: parsed.error,
        });
    }

    return parsed.data.failedJobCount;
}
