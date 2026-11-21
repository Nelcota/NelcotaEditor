import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { clips } from "#/modules/clips/clips.schema";
import { enqueueVideoProcessing } from "#/modules/processing/server/video-processing-queue.server";
import { assertCanStartAnotherVideo } from "#/modules/videos/server/processing-limit.server";
import {
    VIDEO_ALREADY_PROCESSING_MESSAGE,
    resetVideoToQueued,
} from "#/modules/video-records/server/video-progress.server";
import { findOwnedVideo } from "#/modules/video-records/server/find-owned-video.server";
import { runVideoStartTransaction } from "#/modules/videos/server/video-start-transaction.server";
import { FINISHED_VIDEO_STATUSES, isVideoFinished } from "#/modules/video-records/video-status";
import { videoTitleSchema } from "#/modules/video-records/video-title";
import { videos } from "#/modules/video-records/videos.schema";
import { UserFacingError } from "#/shared/server/user-facing-error";

const renameVideoInputSchema = z.object({ videoId: z.uuid(), title: videoTitleSchema });

const retryClipInputSchema = z.object({ videoId: z.uuid(), clipId: z.uuid() });

/** Only finished videos: while processing, the worker may still write the YouTube title. */
export const updateVideoTitle = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(renameVideoInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        // The status is checked in the same statement, so a retry started in between wins.
        const renamedRows = await db
            .update(videos)
            .set({ title: data.title })
            .where(and(eq(videos.id, video.id), inArray(videos.status, FINISHED_VIDEO_STATUSES)))
            .returning({ id: videos.id });

        if (renamedRows.length === 0) {
            throw new UserFacingError("Aguarde o processamento terminar para renomear o vídeo.");
        }
    });

async function findOwnedFailedClipId(videoId: string, clipId: string): Promise<string> {
    const rows = await db
        .select({ id: clips.id, status: clips.status })
        .from(clips)
        .where(and(eq(clips.id, clipId), eq(clips.videoId, videoId)))
        .limit(1);
    const clip = rows[0];

    if (clip === undefined) {
        throw new UserFacingError("Corte não encontrado.");
    }

    if (clip.status !== "failed") {
        throw new UserFacingError("Só é possível refazer um corte que falhou.");
    }

    return clip.id;
}

/**
 * Puts one failed clip back in the queue. The pipeline keeps every finished step, so the worker
 * only renders the clips that are not done yet.
 */
export const retryClip = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(retryClipInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);

        if (isVideoFinished(video.status) === false) {
            throw new UserFacingError("Aguarde o processamento terminar para refazer o corte.");
        }

        const clipId = await findOwnedFailedClipId(video.id, data.clipId);
        const userId = context.user.id;
        // All or nothing: the clip must not turn pending on a video another retry already took,
        // and the job is sent only with the reset that needs it.
        const isReset = await runVideoStartTransaction(
            userId,
            async ({ transaction, jobDatabase }) => {
                await assertCanStartAnotherVideo(userId, transaction);

                if ((await resetVideoToQueued(video.id, transaction)) === false) {
                    return false;
                }

                await transaction
                    .update(clips)
                    .set({ status: "pending" })
                    .where(eq(clips.id, clipId));
                await enqueueVideoProcessing({ videoId: video.id, userId }, jobDatabase);
                return true;
            },
        );

        if (isReset === false) {
            throw new UserFacingError(VIDEO_ALREADY_PROCESSING_MESSAGE);
        }
    });
