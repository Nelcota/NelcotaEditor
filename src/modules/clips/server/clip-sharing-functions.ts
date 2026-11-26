import { randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { assertFeatureEnabled } from "#/modules/app-switches/server/app-switches.server";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { clips } from "#/modules/clips/clips.schema";
import { findClipOfVideo } from "#/modules/clips/server/find-clip-of-video.server";
import { findOwnedVideo } from "#/modules/video-records/server/find-owned-video.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const SHARE_TOKEN_BYTES = 24;

const clipSharingInputSchema = z.object({
    videoId: z.uuid(),
    clipId: z.uuid(),
    isShared: z.boolean(),
});

/**
 * Turns the public link on (a new secret each time) or off. Only rendered clips can be shared;
 * turning a link off stays possible while sharing is paused.
 */
export const setClipSharing = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(clipSharingInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        const clip = await findClipOfVideo(video.id, data.clipId);

        if (data.isShared === false) {
            await db.update(clips).set({ shareToken: null }).where(eq(clips.id, clip.id));
            return;
        }

        if (clip.status !== "done" || clip.outputPath === null) {
            throw new UserFacingError("Só é possível compartilhar um corte que já está pronto.");
        }

        await assertFeatureEnabled("clip-sharing");

        const shareToken = randomBytes(SHARE_TOKEN_BYTES).toString("base64url");

        const updated = await db
            .update(clips)
            .set({ shareToken })
            .where(
                and(eq(clips.id, clip.id), eq(clips.status, "done"), isNotNull(clips.outputPath)),
            )
            .returning({ id: clips.id });

        if (updated.length === 0) {
            throw new UserFacingError("Só é possível compartilhar um corte que já está pronto.");
        }
    });
