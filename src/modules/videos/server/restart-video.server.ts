import { and, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { clips } from "#/modules/clips/clips.schema";
import { enqueueVideoProcessing } from "#/modules/processing/server/video-processing-queue.server";
import { assertVideoStartAllowed } from "#/modules/videos/server/video-start-limits.server";
import { runVideoStartTransaction } from "#/modules/videos/server/video-start-transaction.server";
import {
    VIDEO_ALREADY_PROCESSING_MESSAGE,
    resetVideoToQueued,
} from "#/modules/video-records/server/video-progress.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

interface RestartRequest {
    videoId: string;
    userId: string;
    /** Which of the video's clips go back to "pending". */
    clipCondition: SQL;
}

/**
 * Puts a stopped video back in the queue. All or nothing: the clips must not turn pending on a
 * video another retry already took, and the job is sent only with the reset that needs it.
 */
export async function restartVideo(request: RestartRequest): Promise<void> {
    const { videoId, userId, clipCondition } = request;
    const isReset = await runVideoStartTransaction(userId, async ({ transaction, jobDatabase }) => {
        // A retry renders new files too, so a full account is refused like a new video.
        await assertVideoStartAllowed({ userId, incomingBytes: 0 }, transaction);

        const processingStartedAt = await resetVideoToQueued(videoId, transaction);

        if (processingStartedAt === null) {
            return false;
        }

        await transaction
            .update(clips)
            .set({ status: "pending" })
            .where(and(eq(clips.videoId, videoId), clipCondition));
        await enqueueVideoProcessing({ videoId, userId, processingStartedAt }, jobDatabase);
        return true;
    });

    if (isReset === false) {
        throw new UserFacingError(VIDEO_ALREADY_PROCESSING_MESSAGE);
    }
}
