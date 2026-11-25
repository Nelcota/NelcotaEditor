import { eq, sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { PROCESS_VIDEO_QUEUE } from "#/modules/processing/server/video-processing-queue.server";
import { videos } from "#/modules/video-records/video-records.schema";

// A run's first job is sent in the transaction that stores its start, and pg-boss stamps the job
// with that transaction's now(), which can come just before the start the app wrote.
const RUN_START_TOLERANCE = sql`interval '1 minute'`;

/**
 * Jobs of the video's current run that pg-boss failed: the worker died under them (out of memory,
 * a native crash) or could not record how the run ended. A run that fails normally records it on
 * the video and completes its job, so only these count. A deleted video counts none.
 */
export async function countFailedRunJobs(videoId: string): Promise<number> {
    if (videoId.trim().length === 0) {
        throw new RangeError("Cannot count the failed jobs of a video without an id");
    }

    const rows = await db
        .select({
            failedJobCount:
                sql<number>`(select count(*) from pgboss.job where job.name = ${PROCESS_VIDEO_QUEUE} and job.singleton_key = ${videos.id}::text and job.state = 'failed' and (${videos.processingStartedAt} is null or job.created_on > ${videos.processingStartedAt} - ${RUN_START_TOLERANCE}))`.mapWith(
                    Number,
                ),
        })
        .from(videos)
        .where(eq(videos.id, videoId))
        .limit(1);
    const row = rows[0];

    if (row === undefined) {
        return 0;
    }

    return row.failedJobCount;
}
