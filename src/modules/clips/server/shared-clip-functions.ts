import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
    shareTokenSchema,
    toSharedClipFilePath,
    toSharedClipPagePath,
    toSharedClipPosterPath,
} from "#/modules/clips/model/shared-clip";
import type { SharedClip } from "#/modules/clips/model/shared-clip";
import { findSharedClip } from "#/modules/clips/server/find-shared-clip.server";
import { toPublicUrl } from "#/shared/server/public-url.server";

const sharedClipInputSchema = z.object({ token: shareTokenSchema });

function toPosterUrl(token: string, posterPath: string | null): string | null {
    if (posterPath === null) {
        return null;
    }

    return toPublicUrl(toSharedClipPosterPath(token));
}

/** The public page of a shared clip, with no sign-in; null when the link no longer opens. */
export const getSharedClip = createServerFn({ method: "GET" })
    .validator(sharedClipInputSchema)
    .handler(async ({ data }): Promise<SharedClip | null> => {
        const token = data.token;
        const sharedClip = await findSharedClip(token);

        if (sharedClip === null) {
            return null;
        }

        return {
            title: sharedClip.title,
            aspectRatio: sharedClip.aspectRatio,
            durationSeconds: sharedClip.endSeconds - sharedClip.startSeconds,
            videoPath: toSharedClipFilePath(token),
            pageUrl: toPublicUrl(toSharedClipPagePath(token)),
            videoUrl: toPublicUrl(toSharedClipFilePath(token)),
            posterUrl: toPosterUrl(token, sharedClip.posterPath),
        };
    });
