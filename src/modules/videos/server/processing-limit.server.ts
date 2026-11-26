import { and, count, eq, notInArray } from "drizzle-orm";
import { db } from "#/db/database.server";
import { FINISHED_VIDEO_STATUSES } from "#/modules/video-records/model/video-status";
import type { VideoPurpose } from "#/modules/video-records/model/video-status";
import { videos } from "#/modules/video-records/video-records.schema";
import { UserFacingError } from "#/shared/server/user-facing-error";
import type { PendingUploads } from "#/modules/videos/server/pending-uploads.server";

/** One person (or a bot) must not fill the workers' queue for everyone else. */
export const MAX_VIDEOS_IN_PROGRESS = 3;

/**
 * Raw videos for a format edit are only stored and transcribed, a much lighter job, and a person
 * sends a batch of them at once, so they have slots of their own.
 */
export const MAX_FORMAT_VIDEOS_IN_PROGRESS = 20;

export class TooManyVideosInProgressError extends UserFacingError {
    constructor() {
        super(
            `Você já tem ${MAX_VIDEOS_IN_PROGRESS} vídeos em processamento. Espere um terminar para enviar outro.`,
        );
        this.name = "TooManyVideosInProgressError";
    }
}

export class TooManyFormatVideosInProgressError extends UserFacingError {
    constructor() {
        super(
            `Você já tem ${MAX_FORMAT_VIDEOS_IN_PROGRESS} vídeos sendo preparados. Espere alguns terminarem para enviar mais.`,
        );
        this.name = "TooManyFormatVideosInProgressError";
    }
}

/** The database or the open transaction that holds the user's start lock. */
type QueryExecutor = Pick<typeof db, "select">;

async function countVideosInProgress(
    userId: string,
    executor: QueryExecutor,
    purpose: VideoPurpose,
): Promise<number> {
    // Queued videos count too: they are the ones that wait for the worker.
    const rows = await executor
        .select({ inProgress: count() })
        .from(videos)
        .where(
            and(
                eq(videos.userId, userId),
                eq(videos.purpose, purpose),
                notInArray(videos.status, FINISHED_VIDEO_STATUSES),
            ),
        );

    return rows[0]?.inProgress ?? 0;
}

function assertValidUploadCount(uploadsStillWriting: number): void {
    if (Number.isSafeInteger(uploadsStillWriting) === false || uploadsStillWriting < 0) {
        throw new RangeError(
            `Invalid count of uploads still writing: ${String(uploadsStillWriting)}`,
        );
    }
}

/**
 * Throws when the user already has the most clip videos the worker takes from one person. Run it
 * inside runVideoStartTransaction so the count cannot change before the insert. Uploads still
 * writing have no row yet, so the caller passes how many there are.
 */
export async function assertCanStartAnotherVideo(
    userId: string,
    executor: QueryExecutor,
    uploadsStillWriting: number = 0,
): Promise<void> {
    if (userId.trim().length === 0) {
        throw new RangeError("Cannot check the processing limit of a user without an id");
    }

    assertValidUploadCount(uploadsStillWriting);
    const inProgressCount = await countVideosInProgress(userId, executor, "clips");

    if (inProgressCount + uploadsStillWriting >= MAX_VIDEOS_IN_PROGRESS) {
        throw new TooManyVideosInProgressError();
    }
}

async function assertCanStartAnotherFormatVideo(
    userId: string,
    executor: QueryExecutor,
    uploadsStillWriting: number,
): Promise<void> {
    if (userId.trim().length === 0) {
        throw new RangeError("Cannot check the processing limit of a user without an id");
    }

    assertValidUploadCount(uploadsStillWriting);
    const inProgressCount = await countVideosInProgress(userId, executor, "format");

    if (inProgressCount + uploadsStillWriting >= MAX_FORMAT_VIDEOS_IN_PROGRESS) {
        throw new TooManyFormatVideosInProgressError();
    }
}

interface PurposeSlotCheck {
    userId: string;
    purpose: VideoPurpose;
    pending: PendingUploads;
}

/** Applies the processing limit that matches what the new video is for. */
export async function assertCanStartVideoFor(
    check: PurposeSlotCheck,
    executor: QueryExecutor,
): Promise<void> {
    const { userId, purpose, pending } = check;

    if (purpose === "format") {
        await assertCanStartAnotherFormatVideo(userId, executor, pending.formatCount);
        return;
    }

    await assertCanStartAnotherVideo(userId, executor, pending.count);
}
