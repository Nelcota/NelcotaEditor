import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/database.server";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { clips } from "#/modules/clips/clips.schema";
import { TRANSCRIPTION_LANGUAGES } from "#/modules/preferences/preferences";
import { enqueueVideoProcessing } from "#/modules/processing/server/video-processing-queue.server";
import {
    countReadyClips,
    listUserVideos,
    toVideoSummary,
} from "#/modules/videos/server/video-queries.server";
import { listVideoClips } from "#/modules/clips/server/clip-views.server";
import { toClipView } from "#/modules/clips/server/clip-views.server";
import { findOwnedVideo } from "#/modules/video-records/server/find-owned-video.server";
import { assertCanStartAnotherVideo } from "#/modules/videos/server/processing-limit.server";
import { assertStorageAvailable } from "#/modules/videos/server/storage-quota.server";
import {
    VIDEO_ALREADY_PROCESSING_MESSAGE,
    canMoveVideoTo,
    resetVideoToQueued,
} from "#/modules/video-records/server/video-progress.server";
import { runVideoStartTransaction } from "#/modules/videos/server/video-start-transaction.server";
import {
    MAX_CLIP_COUNT,
    MIN_CLIP_COUNT,
    WORKING_VIDEO_STATUSES,
    isVideoResumable,
} from "#/modules/video-records/video-status";
import type { VideoDetails, VideoSummary } from "#/modules/videos/video-views";
import { toStoredVideoTitle } from "#/modules/video-records/video-title";
import { videos } from "#/modules/video-records/videos.schema";
import { CLIP_LENGTHS } from "#/modules/video-records/clip-length";
import { fetchYoutubePreview } from "#/modules/videos/server/fetch-youtube-preview.server";
import {
    toCanonicalYoutubeUrl,
    toYoutubeVideoId,
    youtubeUrlSchema,
} from "#/modules/videos/youtube-url";
import { getVideoDirectory, resolveStoragePath } from "#/shared/server/storage.server";
import { UserFacingError } from "#/shared/server/user-facing-error";

const videoIdInputSchema = z.object({ videoId: z.uuid() });

// The client checks the id too, but a direct call with a channel or playlist link would make
// yt-dlp walk every entry, so the server requires a single video and keeps only its canonical link.
const youtubeVideoInputSchema = z.object({
    url: youtubeUrlSchema
        .refine((url) => toYoutubeVideoId(url) !== null, "Cole o link de um vídeo do YouTube.")
        .transform((url) => toCanonicalYoutubeUrl(url)),
    clipCount: z.number().int().min(MIN_CLIP_COUNT).max(MAX_CLIP_COUNT),
    clipLength: z.enum(CLIP_LENGTHS),
    language: z.enum(TRANSCRIPTION_LANGUAGES),
});

const YOUTUBE_PLACEHOLDER_TITLE = "Vídeo do YouTube";

/** The real title when YouTube answers; the placeholder otherwise, so a slow lookup never blocks. */
async function resolveYoutubeTitle(url: string): Promise<string> {
    const youtubeId = toYoutubeVideoId(url);

    if (youtubeId === null) {
        return YOUTUBE_PLACEHOLDER_TITLE;
    }

    try {
        const preview = await fetchYoutubePreview(youtubeId);

        if (preview.kind === "found") {
            return toStoredVideoTitle(preview.title) ?? YOUTUBE_PLACEHOLDER_TITLE;
        }

        return YOUTUBE_PLACEHOLDER_TITLE;
    } catch (error) {
        if (error instanceof UserFacingError) {
            return YOUTUBE_PLACEHOLDER_TITLE;
        }

        throw error;
    }
}

export const listVideos = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context }): Promise<Array<VideoSummary>> => {
        const userVideos = await listUserVideos(context.user.id);
        const readyCounts = await countReadyClips(userVideos.map((video) => video.id));

        return userVideos.map((video) => toVideoSummary(video, readyCounts.get(video.id) ?? 0));
    });

export const getVideoDetails = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(videoIdInputSchema)
    .handler(async ({ context, data }): Promise<VideoDetails> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        const videoClips = await listVideoClips(video.id);
        const readyCount = videoClips.filter((clip) => clip.status === "done").length;

        return { video: toVideoSummary(video, readyCount), clips: videoClips.map(toClipView) };
    });

export const createYoutubeVideo = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(youtubeVideoInputSchema)
    .handler(async ({ context, data }): Promise<{ videoId: string }> => {
        const userId = context.user.id;
        const videoId = randomUUID();
        // Looked up before the transaction: a slow YouTube must not hold the user's start lock.
        const title = await resolveYoutubeTitle(data.url);

        await runVideoStartTransaction(userId, async ({ transaction, jobDatabase }) => {
            await assertCanStartAnotherVideo(userId, transaction);
            // The download size is unknown up front, so only an account that is already full is refused.
            await assertStorageAvailable({ userId, incomingBytes: 0 }, transaction);
            await transaction.insert(videos).values({
                id: videoId,
                userId,
                title,
                source: "youtube",
                sourceUrl: data.url,
                requestedClipCount: data.clipCount,
                clipLength: data.clipLength,
                // "" is stored as is: it means "detect automatically", unlike null (videos from before 0002).
                transcriptionLanguage: data.language,
                processingStartedAt: new Date(),
            });
            await enqueueVideoProcessing({ videoId, userId }, jobDatabase);
        });
        return { videoId };
    });

export const retryVideo = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(videoIdInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);

        if (isVideoResumable(video.status) === false) {
            throw new UserFacingError(
                "Só é possível retomar um vídeo que falhou ou foi cancelado.",
            );
        }

        const userId = context.user.id;
        // All or nothing: failed clips must not turn pending on a video another retry already
        // took, and the job is sent only with the reset that needs it.
        const isReset = await runVideoStartTransaction(
            userId,
            async ({ transaction, jobDatabase }) => {
                await assertCanStartAnotherVideo(userId, transaction);

                if ((await resetVideoToQueued(video.id, transaction)) === false) {
                    return false;
                }

                await transaction
                    .update(clips)
                    .set({ status: "pending" })
                    .where(and(eq(clips.videoId, video.id), eq(clips.status, "failed")));
                await enqueueVideoProcessing({ videoId: video.id, userId }, jobDatabase);
                return true;
            },
        );

        if (isReset === false) {
            throw new UserFacingError(VIDEO_ALREADY_PROCESSING_MESSAGE);
        }
    });

export const cancelVideo = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(videoIdInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        const isQueued = sql`${videos.status} = 'queued'`;
        // One statement, so a video that finishes in between is never flagged. The flag stops a
        // running worker step; a video still in the queue has none, so it is cancelled at once.
        const cancelledRows = await db
            .update(videos)
            .set({
                cancelRequested: true,
                status: sql`CASE WHEN ${isQueued} THEN 'cancelled'::video_status ELSE ${videos.status} END`,
                finishedAt: sql`CASE WHEN ${isQueued} THEN ${sql.param(new Date(), videos.finishedAt)} ELSE ${videos.finishedAt} END`,
            })
            .where(and(eq(videos.id, video.id), canMoveVideoTo("cancelled")))
            .returning({ id: videos.id });

        if (cancelledRows.length === 0) {
            throw new UserFacingError("Este vídeo não está sendo processado.");
        }
    });

export const deleteVideo = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(videoIdInputSchema)
    .handler(async ({ context, data }): Promise<void> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        // The status is checked in the same statement, so a worker that starts in between wins.
        const deletedRows = await db
            .delete(videos)
            .where(and(eq(videos.id, video.id), notInArray(videos.status, WORKING_VIDEO_STATUSES)))
            .returning({ id: videos.id });

        if (deletedRows.length === 0) {
            throw new UserFacingError("Aguarde o processamento terminar para excluir este vídeo.");
        }

        await rm(resolveStoragePath(getVideoDirectory(video.id)), { recursive: true, force: true });
    });
