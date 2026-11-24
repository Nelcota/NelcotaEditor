import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { fetchYoutubePreview } from "#/modules/videos/server/fetch-youtube-preview.server";
import type { YoutubePreview } from "#/modules/videos/model/youtube-preview";
import { YOUTUBE_VIDEO_ID_PATTERN } from "#/modules/videos/model/youtube-url";

/** Only an 11-character id reaches the server, so no arbitrary URL is ever fetched. */
const previewInputSchema = z.object({ videoId: z.string().regex(YOUTUBE_VIDEO_ID_PATTERN) });

export const getYoutubePreview = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(previewInputSchema)
    .handler(async ({ data }): Promise<YoutubePreview> => fetchYoutubePreview(data.videoId));
