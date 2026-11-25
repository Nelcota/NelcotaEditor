import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { clips } from "#/modules/clips/clips.schema";
import { findOwnedVideo } from "#/modules/video-records/server/find-owned-video.server";
import { restartVideo } from "#/modules/videos/server/restart-video.server";
import {
    FINISHED_VIDEO_STATUSES,
    isVideoFinished,
} from "#/modules/video-records/model/video-status";
import { videoTitleSchema } from "#/modules/video-records/model/video-title";
import { videos } from "#/modules/video-records/video-records.schema";
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
 * Puts the selected failed clip back in the queue and keeps the earlier processing results.
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
        await restartVideo({
            videoId: video.id,
            userId: context.user.id,
            clipCondition: eq(clips.id, clipId),
        });
    });
