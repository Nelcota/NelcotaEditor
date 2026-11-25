import { notFound } from "@tanstack/react-router";
import { shareTokenSchema } from "#/modules/clips/model/shared-clip";
import type { SharedClip } from "#/modules/clips/model/shared-clip";
import { getSharedClip } from "#/modules/clips/server/shared-clip-functions";

/**
 * A malformed token, an unknown or turned-off link, a clip rendering again and paused sharing all
 * become the 404 page; any other failure reaches the error page.
 */
export async function loadSharedClip(token: string): Promise<SharedClip> {
    // Checked here so a typo in the address answers 404 instead of failing the server's validator.
    if (shareTokenSchema.safeParse(token).success === false) {
        throw notFound();
    }

    const sharedClip = await getSharedClip({ data: { token } });

    if (sharedClip === null) {
        throw notFound();
    }

    return sharedClip;
}
