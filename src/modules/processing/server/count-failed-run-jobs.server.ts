import { sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { PROCESS_VIDEO_QUEUE } from "#/modules/processing/server/video-processing-queue.server";
import type { VideoRun } from "#/modules/video-records/server/video-progress.server";

const countRowSchema = z.object({
    failedJobCount: z.string().regex(/^\d+$/).pipe(z.coerce.number<string>().int().nonnegative()),
});

/** Unstamped jobs from before deployment count only if they were created during this run. */
function createdInRun(processingStartedAt: Date | null): SQL {
    if (processingStartedAt === null) {
        return sql`data ->> 'runStartedAt' is null`;
    }

    const runStartedAt = processingStartedAt.toISOString();
    return sql`(data ->> 'runStartedAt' = ${runStartedAt} or ((data ? 'runStartedAt') is not true and created_on >= ${runStartedAt}::timestamptz))`;
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
        sql`select count(*)::text as "failedJobCount" from pgboss.job where name = ${PROCESS_VIDEO_QUEUE} and singleton_key = ${videoId} and state = 'failed' and ${createdInRun(processingStartedAt)}`,
    );
    const parsed = countRowSchema.safeParse(result.rows[0]);

    if (parsed.success === false) {
        throw new Error(`Unexpected failed job count for video ${videoId}`, {
            cause: parsed.error,
        });
    }

    return parsed.data.failedJobCount;
}
