import { db } from "#/db/database.server";
import { releaseRenderingClips } from "#/modules/clips/server/release-rendering-clips.server";
import {
    markVideoCancelled,
    markVideoFailed,
} from "#/modules/video-records/server/video-progress.server";
import type { VideoRun } from "#/modules/video-records/server/video-progress.server";

/** Finish the run and settle its interrupted clips before another run can start. */
export async function finishStoppedVideo(
    run: VideoRun,
    errorMessage: string | null,
): Promise<void> {
    await db.transaction(async (transaction) => {
        if (
            errorMessage !== null &&
            (await markVideoFailed(run, errorMessage, transaction)) === true
        ) {
            await releaseRenderingClips(run.videoId, "failed", transaction);
            return;
        }

        if ((await markVideoCancelled(run, transaction)) === true) {
            await releaseRenderingClips(run.videoId, "pending", transaction);
        }
    });
}
