import { createServerFn } from "@tanstack/react-start";
import { assertFeatureEnabled } from "#/modules/app-switches/server/app-switches.server";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import {
    startFormatVideoUploadInputSchema,
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
import type { VideoUpload } from "#/modules/videos/videos.schema";
import { DEFAULT_CLIP_LENGTH } from "#/modules/video-records/model/clip-length";
import { getFileStorage } from "#/shared/server/file-storage/get-file-storage.server";

// Only the start of the PUT must happen within it; a slow upload already under way goes on. The
// browser starts it right away, so the link stays short. A cancelled upload or a deleted video
// keeps a cancelled upload row until the reservation ends, so a file sent through it later is
// still counted and then swept.
const UPLOAD_LINK_LIFETIME_SECONDS = 10 * 60;

function appUploadUrl(uploadId: string): string {
    return `/api/videos/uploads/${uploadId}/file`;
}

/**
 * Reserves space and a processing slot, then says where to send the file. Only the start checks
 * the uploads switch: a file already on its way still finishes.
 */
/** Where the browser sends the reserved file: a signed storage link, or the app's own route. */
async function toStartedUpload(upload: VideoUpload): Promise<StartedVideoUpload> {
    const storageUrl = await getFileStorage().createUploadUrl(upload.sourcePath, {
        sizeBytes: upload.declaredBytes,
        lifetimeSeconds: UPLOAD_LINK_LIFETIME_SECONDS,
    });

    if (storageUrl === null) {
        return { uploadId: upload.id, uploadUrl: appUploadUrl(upload.id) };
    }

    return {
        uploadId: upload.id,
        uploadUrl: storageUrl,
        uploadHeaders: { "If-None-Match": "*" },
    };
}

export const startVideoUpload = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(startVideoUploadInputSchema)
    .handler(async ({ context, data }): Promise<StartedVideoUpload> => {
        await assertFeatureEnabled("file-uploads");
        const upload = await reserveVideoUpload(context.user.id, data);
        return await toStartedUpload(upload);
    });

/**
 * Reserves a raw video for a format edit. It skips the clip steps: once stored and transcribed it
 * waits for the person's Claude, so it asks for no clips and lets Whisper detect the language.
 */
export const startFormatVideoUpload = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(startFormatVideoUploadInputSchema)
    .handler(async ({ context, data }): Promise<StartedVideoUpload> => {
        await assertFeatureEnabled("file-uploads");
        const upload = await reserveVideoUpload(context.user.id, {
            fileName: data.fileName,
            title: "",
            sizeBytes: data.sizeBytes,
            clipCount: 0,
            clipLength: DEFAULT_CLIP_LENGTH,
            language: "",
            purpose: "format",
        });
        return await toStartedUpload(upload);
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
