import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { db } from "#/db/database.server";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { clips } from "#/modules/clips/clips.schema";
import { summarizeUsage } from "#/modules/videos/server/usage-summary.server";
import { CLIP_VIEW_COLUMNS } from "#/modules/clips/server/clip-views.server";
import { toClipView } from "#/modules/clips/server/clip-views.server";
import type { LibraryClip, UsageSummary } from "#/modules/videos/model/video-views";
import { videos } from "#/modules/video-records/video-records.schema";

/** Every ready clip of the signed-in user, newest first. */
export const listLibraryClips = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<Array<LibraryClip>> => {
        const userId = context.user.id;
        const rows = await db
            .select({ clip: CLIP_VIEW_COLUMNS, videoId: videos.id, videoTitle: videos.title })
            .from(clips)
            .innerJoin(videos, eq(videos.id, clips.videoId))
            .where(and(eq(videos.userId, userId), eq(clips.status, "done")))
            .orderBy(desc(clips.createdAt), clips.position);

        return rows.map((row) => ({
            clip: toClipView(row.clip),
            videoId: row.videoId,
            videoTitle: row.videoTitle,
            createdAt: row.clip.createdAt.toISOString(),
        }));
    });

export const getUsageSummary = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<UsageSummary> => summarizeUsage(context.user.id));
