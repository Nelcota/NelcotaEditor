import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { isVideoWorking } from "#/modules/video-records/model/video-status";
import type { VideoStatus } from "#/modules/video-records/model/video-status";
import { videos } from "#/modules/video-records/video-records.schema";
import { countReadyClips } from "#/modules/videos/server/video-queries.server";
import { MAX_VIDEOS_PER_PAGE } from "#/modules/videos/model/video-list-page";

/** More than anyone has in the queue at once; it caps the query the poll can ask for. */
export const MAX_WATCHED_VIDEOS = MAX_VIDEOS_PER_PAGE;

const videoProgressInputSchema = z.object({
    videoIds: z.array(z.uuid()).min(1).max(MAX_WATCHED_VIDEOS),
});

/** Just what moves while a video is processed; the list refetches the rest when it changes. */
export interface VideoProgress {
    id: string;
    /** So a stage change can be announced by name after the video leaves the lists that had it. */
    title: string;
    status: VideoStatus;
    progressPercent: number;
    isCancelling: boolean;
    /** Grows while the clips render, before the stage changes. */
    readyClipCount: number;
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
                title: videos.title,
                status: videos.status,
                progressPercent: videos.progressPercent,
                cancelRequested: videos.cancelRequested,
            })
            .from(videos)
            .where(and(eq(videos.userId, context.user.id), inArray(videos.id, data.videoIds)));
        // Only the owned ids found above, so another person's clips are never counted.
        const readyCounts = await countReadyClips(rows.map((row) => row.id));

        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            status: row.status,
            progressPercent: row.progressPercent,
            isCancelling: row.cancelRequested && isVideoWorking(row.status),
            readyClipCount: readyCounts.get(row.id) ?? 0,
        }));
    });
