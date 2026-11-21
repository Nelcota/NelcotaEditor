import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { isVideoWorking } from "#/modules/video-records/video-status";
import type { VideoStatus } from "#/modules/video-records/video-status";
import { videos } from "#/modules/video-records/videos.schema";

/** More than anyone has in the queue at once; it caps the query the poll can ask for. */
export const MAX_WATCHED_VIDEOS = 50;

const videoProgressInputSchema = z.object({
    videoIds: z.array(z.uuid()).min(1).max(MAX_WATCHED_VIDEOS),
});

/** Just what moves while a video is processed; the list refetches the rest when it changes. */
export interface VideoProgress {
    id: string;
    status: VideoStatus;
    progressPercent: number;
    isCancelling: boolean;
}

/**
 * The polled side of the video list: a few columns of the videos still in progress, instead of
 * every video with its clip counts every 2.5 s. Ids that are not the session user's are left out.
 */
export const getVideoProgress = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(videoProgressInputSchema)
    .handler(async ({ context, data }): Promise<Array<VideoProgress>> => {
        const rows = await db
            .select({
                id: videos.id,
                status: videos.status,
                progressPercent: videos.progressPercent,
                cancelRequested: videos.cancelRequested,
            })
            .from(videos)
            .where(and(eq(videos.userId, context.user.id), inArray(videos.id, data.videoIds)));

        return rows.map((row) => ({
            id: row.id,
            status: row.status,
            progressPercent: row.progressPercent,
            isCancelling: row.cancelRequested && isVideoWorking(row.status),
        }));
    });
