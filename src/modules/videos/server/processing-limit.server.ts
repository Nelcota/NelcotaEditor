import { and, count, eq, notInArray } from "drizzle-orm";
import { db } from "#/db/database.server";
import { FINISHED_VIDEO_STATUSES } from "#/modules/video-records/video-status";
import { videos } from "#/modules/video-records/videos.schema";
import { UserFacingError } from "#/shared/server/user-facing-error";

/** One person (or a bot) must not fill the workers' queue for everyone else. */
export const MAX_VIDEOS_IN_PROGRESS = 3;

export class TooManyVideosInProgressError extends UserFacingError {
    constructor() {
        super(
            `Você já tem ${MAX_VIDEOS_IN_PROGRESS} vídeos em processamento. Espere um terminar para enviar outro.`,
        );
        this.name = "TooManyVideosInProgressError";
    }
}

/** The database or the open transaction that holds the user's start lock. */
type QueryExecutor = Pick<typeof db, "select">;

async function countVideosInProgress(userId: string, executor: QueryExecutor): Promise<number> {
    // Queued videos count too: they are the ones that wait for the worker.
    const rows = await executor
        .select({ inProgress: count() })
        .from(videos)
        .where(and(eq(videos.userId, userId), notInArray(videos.status, FINISHED_VIDEO_STATUSES)));

    return rows[0]?.inProgress ?? 0;
}

/**
 * Throws when the user already has the most videos the worker takes from one person. Run it inside
 * runVideoStartTransaction so the count cannot change before the insert. Uploads still writing
 * have no row yet, so the caller passes how many there are.
 */
export async function assertCanStartAnotherVideo(
    userId: string,
    executor: QueryExecutor,
    uploadsStillWriting: number = 0,
): Promise<void> {
    if (userId.trim().length === 0) {
        throw new RangeError("Cannot check the processing limit of a user without an id");
    }

    if (Number.isSafeInteger(uploadsStillWriting) === false || uploadsStillWriting < 0) {
        throw new RangeError(
            `Invalid count of uploads still writing: ${String(uploadsStillWriting)}`,
        );
    }

    const inProgressCount = await countVideosInProgress(userId, executor);

    if (inProgressCount + uploadsStillWriting >= MAX_VIDEOS_IN_PROGRESS) {
        throw new TooManyVideosInProgressError();
    }
}
