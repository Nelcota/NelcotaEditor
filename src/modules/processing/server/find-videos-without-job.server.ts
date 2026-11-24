import { and, asc, inArray, lt, sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { PROCESS_VIDEO_QUEUE } from "#/modules/processing/server/video-processing-queue.server";
import { WORKING_VIDEO_STATUSES } from "#/modules/video-records/model/video-status";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { videos } from "#/modules/video-records/video-records.schema";

/** Statuses that promise the user a job is on the way or running. */
const UNFINISHED_VIDEO_STATUSES: Array<VideoStatus> = ["queued", ...WORKING_VIDEO_STATUSES];
// A video untouched for this long is past any write still on its way (the job that runs it
// commits after the video's last write), and well past a heartbeat that fails a dead worker's job.
const STUCK_AFTER = sql`interval '10 minutes'`;
// Recovery runs every few minutes; anything past this waits for the next run.
const MAX_VIDEOS_PER_RECOVERY = 100;

export interface VideoWithoutJob {
    id: string;
    userId: string;
    cancelRequested: boolean;
    processingStartedAt: Date | null;
}

/**
 * Unfinished videos that no job of the processing queue waits for or runs: their job died (a
 * crash, a stop that could not be recorded, a lock another run held). One statement, so a run that
 * finishes between the two reads is never counted.
 */
export async function findVideosWithoutJob(): Promise<Array<VideoWithoutJob>> {
    return await db
        .select({
            id: videos.id,
            userId: videos.userId,
            cancelRequested: videos.cancelRequested,
            processingStartedAt: videos.processingStartedAt,
        })
        .from(videos)
        .where(
            and(
                inArray(videos.status, UNFINISHED_VIDEO_STATUSES),
                lt(videos.updatedAt, sql`now() - ${STUCK_AFTER}`),
                sql`not exists (select 1 from pgboss.job where job.name = ${PROCESS_VIDEO_QUEUE} and job.singleton_key = ${videos.id}::text and job.state in ('created', 'retry', 'active'))`,
            ),
        )
        .orderBy(asc(videos.updatedAt))
        .limit(MAX_VIDEOS_PER_RECOVERY);
}
