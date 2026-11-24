import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { libraryClipsInputSchema } from "#/modules/videos/model/library-clips-page";
import type { LibraryClipsPage } from "#/modules/videos/model/library-clips-page";
import { listLibraryClipsPage } from "#/modules/videos/server/library-clips.server";
import { summarizeUsage } from "#/modules/videos/server/usage-summary.server";
import type { UsageSummary } from "#/modules/videos/model/video-views";

/** One page of the signed-in user's ready clips, searched and ordered on the server. */
export const listLibraryClips = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(libraryClipsInputSchema)
    .handler(async ({ context, data }): Promise<LibraryClipsPage> =>
        listLibraryClipsPage(context.user.id, data),
    );

export const getUsageSummary = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<UsageSummary> => summarizeUsage(context.user.id));
