import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import {
    adminVideoIdInputSchema,
    adminVideoListInputSchema,
} from "#/modules/admin/model/admin-search";
import type { AdminOverview, AdminVideoPage } from "#/modules/admin/model/admin-views";
import { adminMiddleware } from "#/modules/admin/server/admin-middleware";
import { summarizeAdminOverview } from "#/modules/admin/server/admin-overview.server";
import { listAdminVideos } from "#/modules/admin/server/admin-video-rows.server";
import { recordAdminAction } from "#/modules/admin/server/record-admin-action.server";
import { requestVideoCancellation } from "#/modules/video-records/server/stop-video.server";
import { deleteVideoCoveringUploadLink } from "#/modules/videos/server/delete-video.server";
import { videos } from "#/modules/video-records/video-records.schema";
import { UserFacingError } from "#/shared/server/user-facing-error";

/** The owner goes into the admin audit log next to the video. */
async function findVideoOwnerId(videoId: string): Promise<string> {
    const rows = await db
        .select({ userId: videos.userId })
        .from(videos)
        .where(eq(videos.id, videoId))
        .limit(1);
    const video = rows[0];

    if (video === undefined) {
        throw new UserFacingError("Vídeo não encontrado. Ele pode ter sido excluído.");
    }

    return video.userId;
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
    .handler(async ({ context, data }): Promise<void> => {
        const ownerId = await findVideoOwnerId(data.videoId);

        await requestVideoCancellation(data.videoId);
        await recordAdminAction({
            action: "cancel-video",
            adminId: context.admin.id,
            targetUserId: ownerId,
            videoId: data.videoId,
            details: null,
        });
    });

export const deleteAnyVideo = createServerFn({ method: "POST" })
    .middleware([adminMiddleware])
    .validator(adminVideoIdInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const ownerId = await findVideoOwnerId(data.videoId);

        await deleteVideoCoveringUploadLink({ id: data.videoId, userId: ownerId });
        await recordAdminAction({
            action: "delete-video",
            adminId: context.admin.id,
            targetUserId: ownerId,
            videoId: data.videoId,
            details: null,
        });
    });
