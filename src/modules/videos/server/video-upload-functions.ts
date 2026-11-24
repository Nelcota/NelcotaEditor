import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import {
    startVideoUploadInputSchema,
    videoUploadIdInputSchema,
} from "#/modules/videos/model/video-upload-input";
import type { StartedVideoUpload } from "#/modules/videos/model/video-upload-input";
import { confirmVideoUpload } from "#/modules/videos/server/confirm-video-upload.server";
import {
    discardPendingUpload,
    findOwnedPendingUpload,
} from "#/modules/videos/server/pending-uploads.server";
import { reserveVideoUpload } from "#/modules/videos/server/reserve-video-upload.server";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";

// Only the start of the PUT must happen within it; a slow upload already under way goes on. The
// browser starts it right away, so the link stays short. A cancelled upload or a deleted video
// keeps a cancelled upload row until the reservation ends, so a file sent through it later is
// still counted and then swept.
const UPLOAD_LINK_LIFETIME_SECONDS = 10 * 60;

function appUploadUrl(uploadId: string): string {
    return `/api/videos/uploads/${uploadId}/file`;
}

/** Reserves space and a processing slot, then says where to send the file. */
export const startVideoUpload = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(startVideoUploadInputSchema)
    .handler(async ({ context, data }): Promise<StartedVideoUpload> => {
        const upload = await reserveVideoUpload(context.user.id, data);
        const storageUrl = await getFileStorage().createUploadUrl(upload.sourcePath, {
            sizeBytes: upload.declaredBytes,
            lifetimeSeconds: UPLOAD_LINK_LIFETIME_SECONDS,
        });

        return { uploadId: upload.id, uploadUrl: storageUrl ?? appUploadUrl(upload.id) };
    });

/** Checks the file that arrived and turns the upload into a queued video. */
export const completeVideoUpload = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(videoUploadIdInputSchema)
    .handler(async ({ context, data }): Promise<{ videoId: string }> => {
        const videoId = await confirmVideoUpload(data.uploadId, context.user.id);

        return { videoId };
    });

/** Frees the reservation of an upload the browser gave up on, and any part already sent. */
export const cancelVideoUpload = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(videoUploadIdInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const upload = await findOwnedPendingUpload(data.uploadId, context.user.id);

        if (upload === null) {
            return;
        }

        await discardPendingUpload(upload.id);
    });
