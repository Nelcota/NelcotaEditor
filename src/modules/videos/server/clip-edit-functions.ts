import { randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { clips } from "#/modules/clips/clips.schema";
import { findClipOfVideo } from "#/modules/videos/server/find-clip-of-video.server";
import { findOwnedVideo } from "#/modules/videos/server/video-queries.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const SHARE_TOKEN_BYTES = 24;

const clipSharingInputSchema = z.object({
    videoId: z.uuid(),
    clipId: z.uuid(),
    isShared: z.boolean(),
});

/** Turns the public link on (a new secret each time) or off. Only rendered clips can be shared. */
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

        if (clip.status !== "done") {
            throw new UserFacingError("Só é possível compartilhar um corte que já está pronto.");
        }

        const shareToken = randomBytes(SHARE_TOKEN_BYTES).toString("base64url");

        await db.update(clips).set({ shareToken }).where(eq(clips.id, clip.id));
    });
