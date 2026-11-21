import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { adminVideoIdInputSchema, adminVideoListInputSchema } from "#/modules/admin/admin-search";
import type { AdminOverview, AdminVideoPage } from "#/modules/admin/admin-views";
import { adminMiddleware } from "#/modules/admin/server/admin-middleware";
import { summarizeAdminOverview } from "#/modules/admin/server/admin-overview.server";
import { listAdminVideos } from "#/modules/admin/server/admin-video-rows.server";
import {
    deleteStoppedVideo,
    requestVideoCancellation,
} from "#/modules/video-records/server/stop-video.server";
import { videos } from "#/modules/video-records/videos.schema";
import { UserFacingError } from "#/shared/server/user-facing-error";

async function assertVideoExists(videoId: string): Promise<void> {
    const rows = await db
        .select({ id: videos.id })
        .from(videos)
        .where(eq(videos.id, videoId))
        .limit(1);

    if (rows.length === 0) {
        throw new UserFacingError("Vídeo não encontrado. Ele pode ter sido excluído.");
    }
}

export const getAdminOverview = createServerFn({ method: "GET" })
    .middleware([adminMiddleware])
    .handler(async (): Promise<AdminOverview> => summarizeAdminOverview());

export const getAdminVideos = createServerFn({ method: "GET" })
    .middleware([adminMiddleware])
    .validator(adminVideoListInputSchema)
    .handler(async ({ data }): Promise<AdminVideoPage> => listAdminVideos(data));

export const cancelAnyVideo = createServerFn({ method: "POST" })
    .middleware([adminMiddleware])
    .validator(adminVideoIdInputSchema)
    .handler(async ({ data }): Promise<void> => {
        await assertVideoExists(data.videoId);
        await requestVideoCancellation(data.videoId);
    });

export const deleteAnyVideo = createServerFn({ method: "POST" })
    .middleware([adminMiddleware])
    .validator(adminVideoIdInputSchema)
    .handler(async ({ data }): Promise<void> => {
        await assertVideoExists(data.videoId);
        await deleteStoppedVideo(data.videoId);
    });
