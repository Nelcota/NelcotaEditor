import { rm } from "node:fs/promises";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { db } from "#/db/database.server";
import { authMiddleware } from "#/modules/auth/server/auth-middleware";
import { z } from "zod";
import { clips } from "#/modules/clips/clips.schema";
import type { Clip } from "#/modules/clips/clips.schema";
import type { CaptionWord, StudioDraft } from "#/modules/clips/model/clip-studio";
import {
    renderClipDraftInputSchema,
    saveClipDraftInputSchema,
} from "#/modules/clips/model/clip-studio";
import { enqueueVideoProcessing } from "#/modules/processing/server/video-processing-queue.server";
import type { RenderDraftResult, SaveDraftResult } from "#/modules/studio/model/clip-studio-view";
import {
    assertDraftFitsVideo,
    assertVideoEditable,
    findStudioWords,
    readStoredDraft,
} from "#/modules/studio/server/clip-studio.server";
import { findClipOfVideo } from "#/modules/clips/server/find-clip-of-video.server";
import { requeueThenRemoveOldOutput } from "#/modules/studio/server/remove-old-output-after-requeue";
import { assertCanStartAnotherVideo } from "#/modules/videos/server/processing-limit.server";
import {
    VIDEO_ALREADY_PROCESSING_MESSAGE,
    resetVideoToQueued,
} from "#/modules/video-records/server/video-progress.server";
import { findOwnedVideo } from "#/modules/video-records/server/find-owned-video.server";
import { runVideoStartTransaction } from "#/modules/videos/server/video-start-transaction.server";
import { UserFacingError } from "#/shared/server/user-facing-error";
import { resolveStoragePath } from "#/shared/server/storage.server";
import { logger } from "#/shared/server/logger.server";

const studioWordsInputSchema = z.object({ videoId: z.uuid() });

const nextDraftVersion = sql`${clips.studioDraftVersion} + 1`;

/** The video's transcript words, shared by every clip the Studio opens. */
export const getStudioWords = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(studioWordsInputSchema)
    .handler(async ({ context, data }): Promise<Array<CaptionWord>> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        return findStudioWords(video.id);
    });

/**
 * Keeps the Studio's edits without rendering them. The version only moves forward when the
 * caller saw the latest one, so a second tab can never silently overwrite the first.
 */
export const saveClipDraft = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(saveClipDraftInputSchema)
    .handler(async ({ context, data }): Promise<SaveDraftResult> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        assertVideoEditable(video);
        assertDraftFitsVideo(data.draft, video);
        const clip = await findClipOfVideo(video.id, data.clipId);

        const updated = await db
            .update(clips)
            .set({ studioDraft: data.draft, studioDraftVersion: nextDraftVersion })
            .where(and(eq(clips.id, clip.id), eq(clips.studioDraftVersion, data.expectedVersion)))
            .returning({ draftVersion: clips.studioDraftVersion });
        const row = updated[0];

        if (row === undefined) {
            return { kind: "conflict" };
        }

        return { kind: "saved", draftVersion: row.draftVersion };
    });

interface DraftToApply {
    userId: string;
    videoId: string;
    clip: Clip;
    draft: StudioDraft;
    expectedVersion: number;
}

/**
 * Applies the draft and puts the video back in the queue in one transaction, with the job: a video
 * another tab already queued keeps its clip as it was, and the person is told it is already
 * processing. The user's start lock keeps two requests from both passing the processing limit.
 */
async function applyDraftAndRequeue(target: DraftToApply): Promise<RenderDraftResult> {
    const { userId, videoId, clip, draft, expectedVersion } = target;

    return runVideoStartTransaction(
        userId,
        async ({ transaction, jobDatabase }): Promise<RenderDraftResult> => {
            await assertCanStartAnotherVideo(userId, transaction);
            const updated = await transaction
                .update(clips)
                .set({
                    startSeconds: draft.startSeconds,
                    endSeconds: draft.endSeconds,
                    aspectRatio: draft.aspectRatio,
                    captionStyle: draft.captionStyle,
                    captionColor: draft.captionColor,
                    captionSize: draft.captionSize,
                    captionPosition: draft.captionPosition,
                    captionFont: draft.captionFont,
                    captionCues: draft.cues,
                    studioDraft: null,
                    studioDraftVersion: nextDraftVersion,
                    status: "pending",
                    outputPath: null,
                    outputBytes: null,
                })
                .where(and(eq(clips.id, clip.id), eq(clips.studioDraftVersion, expectedVersion)))
                .returning({ id: clips.id });

            if (updated.length === 0) {
                return { kind: "conflict" };
            }

            // Throwing rolls the clip update back.
            if ((await resetVideoToQueued(videoId, transaction)) === false) {
                throw new UserFacingError(VIDEO_ALREADY_PROCESSING_MESSAGE);
            }

            await enqueueVideoProcessing({ videoId, userId }, jobDatabase);
            return { kind: "queued" };
        },
    );
}

/** Runs after the commit, so a failure here only leaves an unused file behind. */
async function removeOldOutput(clip: Clip): Promise<void> {
    const outputPath = clip.outputPath;

    if (outputPath === null) {
        return;
    }

    try {
        await rm(resolveStoragePath(outputPath), { force: true });
    } catch (error) {
        logger.error({ clipId: clip.id, error }, "Failed to remove the previous clip file");
    }
}

/**
 * Applies the saved draft to the clip and sends it back to Brasa. The old file is removed once that
 * is committed; the pipeline keeps every finished step, so only this clip is rendered again.
 */
export const renderClipDraft = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(renderClipDraftInputSchema)
    .handler(async ({ context, data }): Promise<RenderDraftResult> => {
        const video = await findOwnedVideo(data.videoId, context.user.id);
        assertVideoEditable(video);
        const clip = await findClipOfVideo(video.id, data.clipId);
        const draft = readStoredDraft(clip);

        if (clip.studioDraftVersion !== data.expectedVersion) {
            return { kind: "conflict" };
        }

        if (draft === null) {
            throw new UserFacingError("Não há alterações para renderizar.");
        }

        assertDraftFitsVideo(draft, video);
        return requeueThenRemoveOldOutput(
            () =>
                applyDraftAndRequeue({
                    userId: context.user.id,
                    videoId: video.id,
                    clip,
                    draft,
                    expectedVersion: data.expectedVersion,
                }),
            () => removeOldOutput(clip),
        );
    });
